-- DMI Industrial — Property Management Platform
-- Fase 6n: nuevo rol "Superadministrador" con acceso total — sin restricción de rol ni
-- de región — por encima de la matriz de permisos existente (src/lib/permissions.ts).
-- Petición explícita del usuario tras confirmar que ningún rol actual (incluido
-- Administrador del Sistema) tiene acceso irrestricto por diseño.
--
-- Ejecutar en el SQL Editor de Supabase (o vía scripts/run-sql.ts) después de 0001-0012.

-- =========================================================
-- 1. Permitir el nuevo valor en profiles.rol
-- =========================================================

alter table profiles drop constraint profiles_rol_check;
alter table profiles add constraint profiles_rol_check
  check (rol in ('Property Manager', 'Facility Manager', 'Dirección', 'Contabilidad', 'Administrador del Sistema', 'Superadministrador'));

-- =========================================================
-- 2. Bypass de ámbito de región por rol (además del flag acceso_total existente) —
-- así un Superadministrador ve/edita cualquier región aunque alguien olvide marcar
-- acceso_total=true al crear el perfil.
-- =========================================================

create or replace function public.mi_ambito_permite(p_region text) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles pr
    where pr.id = auth.uid() and pr.activo
      and (pr.acceso_total or pr.rol = 'Superadministrador' or p_region = any(pr.ambito_regiones))
  );
$$;

-- =========================================================
-- 3. El Superadministrador también administra usuarios, igual que Administrador del
-- Sistema — reutilizando este único helper (ya security definer, ya usado por la
-- policy "admin_manage_profiles" de 0004/0005), así que solo un admin/superadmin
-- existente puede crear al siguiente Superadministrador.
-- =========================================================

create or replace function public.es_administrador_del_sistema()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('Administrador del Sistema', 'Superadministrador'));
$$;

-- El trigger de 0004 repetía su propio chequeo inline en vez de usar el helper de
-- arriba — se simplifica para reusarlo, lo que además de quitar la duplicación
-- incluye automáticamente al Superadministrador sin repetir la lista de roles.
create or replace function public.proteger_campos_privilegio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.es_administrador_del_sistema() then
    new.rol := old.rol;
    new.ambito_regiones := old.ambito_regiones;
    new.ambito_parques := old.ambito_parques;
    new.ambito_naves := old.ambito_naves;
    new.acceso_total := old.acceso_total;
    new.activo := old.activo;
  end if;
  return new;
end;
$$;

-- =========================================================
-- 4. Agregar 'Superadministrador' a cada policy que restringe por rol (0012). Las
-- policies que ya excluyen por "not in (...)" (select_contratos, select_renovaciones)
-- no se tocan: 'Superadministrador' nunca está en esas listas de exclusión, así que ya
-- pasan. Tampoco se tocan las policies sin ningún chequeo de rol (catálogos de
-- portafolio, tablas dependientes de nave sin escritura) — ya cubiertas por el fix de
-- mi_ambito_permite() de arriba.
-- =========================================================

alter policy "insert_naves" on naves with check (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);
alter policy "update_naves" on naves using (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
) with check (
  public.mi_ambito_permite((select pq.region from parques pq where pq.id = naves.parque_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);

alter policy "insert_documentos" on documentos with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
  and (
    (documentos.tipo in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Contabilidad', 'Superadministrador'))
    or
    (documentos.tipo not in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador'))
  )
);
alter policy "update_documentos" on documentos with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = documentos.nave_id))
  and (
    (documentos.tipo in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Contabilidad', 'Superadministrador'))
    or
    (documentos.tipo not in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador'))
  )
);

alter policy "insert_documento_versiones" on documento_versiones with check (
  exists (
    select 1 from documentos d join naves n on n.id = d.nave_id join parques pq on pq.id = n.parque_id
    where d.id = documento_versiones.documento_id
      and public.mi_ambito_permite(pq.region)
      and (
        (d.tipo in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Contabilidad', 'Superadministrador'))
        or
        (d.tipo not in ('Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal') and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador'))
      )
  )
);

alter policy "insert_contratos" on contratos with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() in ('Property Manager', 'Superadministrador')
);
alter policy "update_contratos" on contratos using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() in ('Property Manager', 'Superadministrador')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = contratos.nave_id))
  and public.mi_rol() in ('Property Manager', 'Superadministrador')
);

alter policy "insert_renovaciones" on renovaciones with check (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() in ('Property Manager', 'Dirección', 'Superadministrador')
);
alter policy "update_renovaciones" on renovaciones using (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() in ('Property Manager', 'Dirección', 'Superadministrador')
) with check (
  public.mi_ambito_permite((
    select pq.region from contratos c join naves n on n.id = c.nave_id join parques pq on pq.id = n.parque_id
    where c.id = renovaciones.contrato_id
  ))
  and public.mi_rol() in ('Property Manager', 'Dirección', 'Superadministrador')
);

alter policy "insert_ordenes_trabajo" on ordenes_trabajo with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);
alter policy "update_ordenes_trabajo" on ordenes_trabajo using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = ordenes_trabajo.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);

alter policy "insert_ordenes_pausas" on ordenes_pausas with check (
  exists (
    select 1 from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);
alter policy "update_ordenes_pausas" on ordenes_pausas using (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
) with check (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_pausas.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);

alter policy "insert_ordenes_evidencia" on ordenes_evidencia with check (
  exists (
    select 1 from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);
alter policy "update_ordenes_evidencia" on ordenes_evidencia using (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
) with check (
  public.mi_ambito_permite((
    select pq.region from ordenes_trabajo o join naves n on n.id = o.nave_id join parques pq on pq.id = n.parque_id
    where o.id = ordenes_evidencia.orden_id
  ))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);

alter policy "insert_tareas_operativas" on tareas_operativas with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);
alter policy "update_tareas_operativas" on tareas_operativas using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = tareas_operativas.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);

alter policy "insert_proyectos_capex" on proyectos_capex with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);
alter policy "update_proyectos_capex" on proyectos_capex using (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Dirección', 'Superadministrador')
) with check (
  public.mi_ambito_permite((select pq.region from naves n join parques pq on pq.id = n.parque_id where n.id = proyectos_capex.nave_id))
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Dirección', 'Superadministrador')
);

alter policy "insert_capex_cotizaciones" on capex_cotizaciones with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_cotizaciones.proyecto_capex_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Property Manager', 'Facility Manager', 'Superadministrador')
);

-- capex_votos: el Superadministrador puede votar como sí mismo (usuario_id debe seguir
-- siendo quien ejecuta) — no puede suplantar el voto de otra persona.
alter policy "insert_capex_votos" on capex_votos with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Dirección', 'Superadministrador')
  and capex_votos.usuario_id = auth.uid()
);
alter policy "update_capex_votos" on capex_votos using (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Dirección', 'Superadministrador') and capex_votos.usuario_id = auth.uid()
) with check (
  exists (
    select 1 from proyectos_capex p join naves n on n.id = p.nave_id join parques pq on pq.id = n.parque_id
    where p.id = capex_votos.proyecto_id and public.mi_ambito_permite(pq.region)
  )
  and public.mi_rol() in ('Dirección', 'Superadministrador') and capex_votos.usuario_id = auth.uid()
);

alter policy "select_bitacora" on bitacora using (
  public.mi_rol() in ('Administrador del Sistema', 'Dirección', 'Superadministrador')
);
