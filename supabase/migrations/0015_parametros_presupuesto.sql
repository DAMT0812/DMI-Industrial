-- Migra a `parametros_configurables` las constantes de presupuesto/meta que
-- vivian hardcodeadas en src/data/ (portafolioKpis.ts, mantenimientoKpis.ts,
-- proyectosCapex.ts, ordenesTrabajo.ts): bolsa anual de CapEx, presupuesto
-- mensual de renta, presupuesto anual de OpEx, meta de horas de SLA y el SLA
-- por prioridad de ticket. La tabla y sus policies de lectura ya existian
-- desde el esquema base (0001/0002) sin usarse.
--
-- De paso se cierra un hueco de RLS: la policy de escritura original permitia
-- a CUALQUIER usuario autenticado (incluido un Property Manager sin
-- privilegios) sobrescribir estas metas via un POST directo a PostgREST, sin
-- pasar por ninguna pantalla. Se acota a Administrador del Sistema /
-- Superadministrador, igual que el resto de tablas de configuracion.

insert into parametros_configurables (clave, valor, descripcion, actualizado_en) values
  ('capex_bolsa_anual_usd', '12500000', 'Bolsa anual autorizada para proyectos CapEx (USD)', now()),
  ('presupuesto_mensual_usd', '1905000', 'Presupuesto mensual de renta del portafolio (USD)', now()),
  ('opex_presupuesto_anual_usd', '4200000', 'Presupuesto anual de OpEx de mantenimiento (USD)', now()),
  ('sla_meta_horas', '36', 'Meta interna de horas de atencion de SLA (promedio)', now()),
  ('sla_horas', '{"Crítica": 4, "Alta": 24, "Media": 48, "Baja": 72}', 'Horas de SLA comprometidas por prioridad de ticket', now());

drop policy authenticated_write_parametros_configurables on parametros_configurables;

create policy write_parametros_configurables on parametros_configurables
  for all using (es_administrador_del_sistema()) with check (es_administrador_del_sistema());
