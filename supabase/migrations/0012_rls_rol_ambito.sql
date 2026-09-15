-- DMI Industrial — Property Management Platform
-- Fase 6m: RLS real por rol y ámbito (región) — reemplaza la línea base de 0002_rls.sql
-- ("cualquier autenticado lee/escribe cualquier tabla") por policies que reflejan la
-- matriz de src/lib/permissions.ts y el ámbito de región de profiles.ambito_regiones /
-- profiles.acceso_total, exactamente como ya se comporta el cliente — con una excepción
-- deliberada: proyectos_capex y sus tablas hijas no tienen filtro de región en el
-- cliente hoy, pero se acotan igual aquí (decisión explícita, ver plan de Fase 6m).
--
-- Ejecutar en el SQL Editor de Supabase (o vía scripts/run-sql.ts) después de 0001-0011.

-- =========================================================
-- Funciones auxiliares (mismo patrón security definer que
-- es_administrador_del_sistema(), de 0005, para evitar recursión de RLS)
-- =========================================================

-- Rol del usuario autenticado — null si no hay perfil o si está inactivo, así que
-- cualquier comparación "mi_rol() = 'X'" falla de forma segura para un perfil desactivado
-- sin tener que repetir el chequeo de `activo` en cada policy que solo mira el rol.
create or replace function public.mi_rol() returns text
  language sql security definer stable set search_path = public as $$
  select rol from profiles where id = auth.uid() and activo;
$$;

-- ¿Mi perfil está activo? (false si no existe perfil) — para las pocas policies que no
-- exigen ni rol ni región (p. ej. difundir una notificación a otro usuario).
create or replace function public.mi_perfil_activo() returns boolean
  language sql security definer stable set search_path = public as $$
  select coalesce((select activo from profiles where id = auth.uid()), false);
$$;

-- ¿Mi ámbito permite esta región? true si acceso_total, o si la región está en mi
-- arreglo. Si acceso_total=false y ambito_regiones está vacío, NIEGA — más estricto que
-- el fallback-a-"todas" que hace regionDesdeAmbito() en el cliente para ese caso raro;
-- los 2 perfiles reales hoy tienen acceso_total=true, así que esto no afecta a nadie
-- todavía y es la postura correcta para una fase de endurecimiento.
create or replace function public.mi_ambito_permite(p_region text) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles pr
    where pr.id = auth.uid() and pr.activo
      and (pr.acceso_total or p_region = any(pr.ambito_regiones))
  );
$$;

-- =========================================================
-- Quitar las policies genéricas "authenticated_read_*"/"authenticated_write_*" de 0002
-- para todas las tablas operativas. Se excluyen: profiles y catalogo_sistemas_criticos
-- (ya usan sus propias policies, con nombres distintos, sin cambios en esta fase) y
-- calendario_dias_festivos/parametros_configurables (vacías, sin ningún camino de
-- lectura/escritura en el cliente todavía — se dejan tal cual, abiertas pero inertes).
-- =========================================================

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and (policyname like 'authenticated_read_%' or policyname like 'authenticated_write_%')
      and tablename not in ('catalogo_sistemas_criticos', 'profiles', 'calendario_dias_festivos', 'parametros_configurables')
  loop
    execute format('drop policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- =========================================================
-- Catálogos de portafolio (sin ámbito de región — la estructura del portafolio en sí
-- no se oculta a nadie, solo el contenido operativo de cada nave). Ninguna pantalla
-- escribe estas tablas hoy, así que no llevan policy de escritura.
-- =========================================================

create policy "select_parques" on parques for select using (public.mi_perfil_activo());
create policy "select_brokers" on brokers for select using (public.mi_perfil_activo());
create policy "select_contratistas" on contratistas for select using (public.mi_perfil_activo());
create policy "select_inquilinos" on inquilinos for select using (public.mi_perfil_activo());
create policy "select_matriz_confiabilidad" on matriz_confiabilidad for select using (public.mi_perfil_activo());

-- =========================================================
-- Tablas dependientes de una nave, sin ningún camino de escritura en el cliente hoy:
-- solo SELECT acotado por región; sin policy de escritura (bloqueada para todos).
-- =========================================================

create policy "select_sistemas_criticos_nave" on sistemas_criticos_nave for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = sistemas_criticos_nave.nave_id))
);

create policy "select_solicitudes_cotizacion" on solicitudes_cotizacion for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = solicitudes_cotizacion.nave_id))
);

create policy "select_solicitud_propuestas" on solicitud_propuestas for select using (
  public.mi_ambito_permite((
    select pq.region from solicitudes_cotizacion s join naves n on n.id = s.nave_id join parques pq on pq.id = n.parque_id
    where s.id = solicitud_propuestas.solicitud_id
  ))
);

create policy "select_propietarios_legales" on propietarios_legales for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = propietarios_legales.nave_id))
);

create policy "select_estudios_tecnicos" on estudios_tecnicos for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = estudios_tecnicos.nave_id))
);

create policy "select_contactos_emergencia" on contactos_emergencia for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contactos_emergencia.nave_id))
);

create policy "select_eventos_calendario" on eventos_calendario for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = eventos_calendario.nave_id))
);

create policy "select_documento_excepciones" on documento_excepciones for select using (
  public.mi_ambito_permite((
    select pq.region from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = documento_excepciones.documento_id
  ))
);

create policy "select_polizas" on polizas for select using (
  public.mi_ambito_permite((
    select pq.region from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = polizas.documento_id
  ))
);

create policy "select_predial" on predial for select using (
  public.mi_ambito_permite((
    select pq.region from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = predial.documento_id
  ))
);

create policy "select_tareas_firmas" on tareas_firmas for select using (
  public.mi_ambito_permite((
    select pq.region from tareas_operativas t join naves n on n.id = t.nave_id join parques pq on pq.id = n.parque_id
    where t.id = tareas_firmas.tarea_id
  ))
);

-- =========================================================
-- naves — lectura acotada por región; alta/edición: Property Manager o Facility Manager
-- (puedeAltaNave / puedeEditarNave).
-- =========================================================

create policy "select_naves" on naves for select using (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
);
create policy "insert_naves" on naves for insert with check (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);
create policy "update_naves" on naves for update using (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
) with check (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);

-- =========================================================
-- documentos / documento_versiones — lectura acotada por región; edición según el tipo
-- de documento (puedeEditarDocumentoObra vs puedeEditarDocumentoPredialCfe, ver
-- ObraConstruccionTab.tsx / PredialCfeServiciosTab.tsx). Los 2 tipos de póliza (sin tab
-- de edición hoy) caen en la rama "obra" como catch-all inofensivo.
-- =========================================================

create policy "select_documentos" on documentos for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
);
create policy "insert_documentos" on documentos for insert with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
  and (
    (documentos.tipo in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Contabilidad'))
    or
    (documentos.tipo not in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Facility Manager'))
  )
);
create policy "update_documentos" on documentos for update using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
  and (
    (documentos.tipo in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Contabilidad'))
    or
    (documentos.tipo not in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Facility Manager'))
  )
);

create policy "select_documento_versiones" on documento_versiones for select using (
  public.mi_ambito_permite((
    select pq.region from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = documento_versiones.documento_id
  ))
);
create policy "insert_documento_versiones" on documento_versiones for insert with check (
  exists (
    select 1 from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = documento_versiones.documento_id
      and public.mi_ambito_permite(pq.region)
      and (
        (d.tipo in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Contabilidad'))
        or
        (d.tipo not in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Facility Manager'))
      )
  )
);

-- =========================================================
-- contratos — lectura bloqueada para Facility Manager y Administrador del Sistema
-- (puedeVerContrato, regla transversal 4.6); edición solo Property Manager
-- (puedeEditarContrato).
-- =========================================================

create policy "select_contratos" on contratos for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() not in ('Facility Manager', 'Administrador del Sistema')
);
create policy "insert_contratos" on contratos for insert with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() = 'Property Manager'
);
create policy "update_contratos" on contratos for update using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() = 'Property Manager'
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() = 'Property Manager'
);

-- renovaciones — mismo ámbito que su contrato; PM prepara y Dirección resuelve
-- (puedeResolverRenovacion), ambos comparten la tabla — la distinción fina de qué
-- campo toca cada quien queda, como hoy, a nivel de UI/cliente.
create policy "select_renovaciones" on renovaciones for select using (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() not in ('Facility Manager', 'Administrador del Sistema')
);
create policy "insert_renovaciones" on renovaciones for insert with check (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() in ('Property Manager', 'Dirección')
);
create policy "update_renovaciones" on renovaciones for update using (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() in ('Property Manager', 'Dirección')
) with check (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() in ('Property Manager', 'Dirección')
);

-- =========================================================
-- ordenes_trabajo / ordenes_pausas / ordenes_evidencia — Property Manager o Facility
-- Manager (puedeEditarOrden / puedeValidarCierreOrden).
-- =========================================================

create policy "select_ordenes_trabajo" on ordenes_trabajo for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
);
create policy "insert_ordenes_trabajo" on ordenes_trabajo for insert with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);
create policy "update_ordenes_trabajo" on ordenes_trabajo for update using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);

create policy "select_ordenes_pausas" on ordenes_pausas for select using (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id
  ))
);
create policy "insert_ordenes_pausas" on ordenes_pausas for insert with check (
  exists (
    select 1 from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);
create policy "update_ordenes_pausas" on ordenes_pausas for update using (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
) with check (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);

create policy "select_ordenes_evidencia" on ordenes_evidencia for select using (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id
  ))
);
create policy "insert_ordenes_evidencia" on ordenes_evidencia for insert with check (
  exists (
    select 1 from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);
create policy "update_ordenes_evidencia" on ordenes_evidencia for update using (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
) with check (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);

-- =========================================================
-- tareas_operativas — Property Manager o Facility Manager (puedeEditarTarea).
-- =========================================================

create policy "select_tareas_operativas" on tareas_operativas for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
);
create policy "insert_tareas_operativas" on tareas_operativas for insert with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);
create policy "update_tareas_operativas" on tareas_operativas for update using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);

-- =========================================================
-- proyectos_capex / capex_cotizaciones — acotados por región (endurecimiento nuevo,
-- decisión explícita de esta fase: el cliente hoy no filtra CapEx por región).
-- Edición de ficha (PM/FM) y resolución del comité (Dirección) conviven en la misma
-- tabla — igual que renovaciones, la distinción fina de qué campo toca cada quien
-- queda a nivel de UI.
-- =========================================================

create policy "select_proyectos_capex" on proyectos_capex for select using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
);
create policy "insert_proyectos_capex" on proyectos_capex for insert with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);
create policy "update_proyectos_capex" on proyectos_capex for update using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Dirección')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Dirección')
);

create policy "select_capex_cotizaciones" on capex_cotizaciones for select using (
  public.mi_ambito_permite((
    select pq.region from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_cotizaciones.proyecto_capex_id
  ))
);
create policy "insert_capex_cotizaciones" on capex_cotizaciones for insert with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_cotizaciones.proyecto_capex_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Property Manager', 'Facility Manager')
);

-- capex_votos — Dirección vota (puedeVotarCapex), y solo por sí misma (usuario_id debe
-- ser quien ejecuta), acotado por región. Lectura sin restricción de rol: el conteo de
-- votos es visible a cualquiera con ámbito sobre el proyecto (así lo muestra la ficha).
create policy "select_capex_votos" on capex_votos for select using (
  public.mi_ambito_permite((
    select pq.region from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id
  ))
);
create policy "insert_capex_votos" on capex_votos for insert with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() = 'Dirección'
  and capex_votos.usuario_id = auth.uid()
);
create policy "update_capex_votos" on capex_votos for update using (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() = 'Dirección' and capex_votos.usuario_id = auth.uid()
) with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() = 'Dirección' and capex_votos.usuario_id = auth.uid()
);

-- =========================================================
-- notificaciones — cada quien lee/marca-leídas solo las propias; el disparo automático
-- (Fase 6j) las difunde a todos los perfiles, así que quien inserta no es el
-- destinatario — por eso el insert solo exige un perfil activo, no ámbito ni rol.
-- =========================================================

create policy "select_notificaciones" on notificaciones for select using (
  notificaciones.destinatario_id = auth.uid()
);
create policy "insert_notificaciones" on notificaciones for insert with check (
  public.mi_perfil_activo()
);
create policy "update_notificaciones" on notificaciones for update using (
  notificaciones.destinatario_id = auth.uid()
) with check (
  notificaciones.destinatario_id = auth.uid()
);

-- =========================================================
-- bitacora — endurecido: antes cualquier autenticado la leía vía REST aunque
-- BitacoraPage ya la bloqueaba en la UI a Administrador del Sistema / Dirección
-- (puedeVerBitacora). El insert queda igual (cualquier autenticado activo — es el
-- único punto de escritura de auditoría, y no tiene policy de update/delete, por lo
-- que sigue siendo inmutable para todos, incluido el Administrador del Sistema).
-- =========================================================

drop policy if exists "authenticated_read_bitacora" on bitacora;
create policy "select_bitacora" on bitacora for select using (
  public.mi_rol() in ('Administrador del Sistema', 'Dirección')
);
