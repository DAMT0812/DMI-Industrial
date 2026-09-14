-- DMI Industrial — Property Management Platform
-- Fase 6a v2: seguridad a nivel de fila (RLS) — línea base.
--
-- Regla para esta fase: cualquier usuario autenticado puede leer y escribir en las
-- tablas operativas (igual que la maqueta actual). El control fino por rol y ámbito
-- (región/parque/inmueble) de la sección 4 del prompt de referencia se implementa en
-- la Fase 6c, sobre esta misma base, sin volver a cambiar el esquema.
--
-- La bitácora es la excepción desde ya: es de solo inserción y lectura, nunca editable
-- ni borrable por nadie (ni siquiera el Administrador del Sistema), como exige 6.17.

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'parques', 'brokers', 'contratistas', 'inquilinos', 'naves', 'documentos',
    'documento_versiones', 'documento_excepciones', 'polizas', 'predial',
    'contratos', 'renovaciones', 'sistemas_criticos_nave', 'ordenes_trabajo',
    'ordenes_pausas', 'ordenes_evidencia', 'tareas_operativas', 'tareas_firmas',
    'proyectos_capex', 'capex_cotizaciones', 'capex_votos',
    'solicitudes_cotizacion', 'solicitud_propuestas',
    'propietarios_legales', 'estudios_tecnicos', 'contactos_emergencia',
    'eventos_calendario', 'matriz_confiabilidad', 'notificaciones',
    'calendario_dias_festivos', 'parametros_configurables'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy "authenticated_read_%s" on %I for select using (auth.role() = ''authenticated'');',
      t, t
    );
    execute format(
      'create policy "authenticated_write_%s" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
      t, t
    );
  end loop;
end $$;

-- catalogo_sistemas_criticos: catálogo fijo, cualquier autenticado lo lee; solo se
-- modifica desde el panel de catálogos (Fase 6c) restringido a Administrador del Sistema.
alter table catalogo_sistemas_criticos enable row level security;
create policy "authenticated_read_catalogo_sistemas_criticos" on catalogo_sistemas_criticos
  for select using (auth.role() = 'authenticated');

-- profiles: cualquier autenticado ve todos los perfiles (para mostrar responsables/roles),
-- pero solo modifica el propio. La administración de otros usuarios (alta, rol, ámbito,
-- activación) queda para el Administrador del Sistema vía función/RPC en Fase 6c.
alter table profiles enable row level security;

create policy "authenticated_read_profiles" on profiles
  for select using (auth.role() = 'authenticated');

create policy "self_update_profiles" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "self_insert_profiles" on profiles
  for insert with check (auth.uid() = id);

-- bitacora: inmutable. Solo insert y select para autenticados; sin policies de
-- update/delete, por lo que quedan bloqueados por defecto para todos, incluido el
-- Administrador del Sistema.
alter table bitacora enable row level security;

create policy "authenticated_read_bitacora" on bitacora
  for select using (auth.role() = 'authenticated');

create policy "authenticated_insert_bitacora" on bitacora
  for insert with check (auth.role() = 'authenticated');
