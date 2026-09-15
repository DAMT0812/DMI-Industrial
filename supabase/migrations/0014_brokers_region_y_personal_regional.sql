-- Fase 6v: cierra las últimas dos brechas de datos mock en el Expediente 360°.
--
-- 1) La tabla `brokers` ya existía con los 3 registros reales (heredada del
--    esquema base) pero sin la región que el cliente usa para resolver qué
--    broker corresponde a cada nave (una asignación por región, no por nave
--    individual — así lo modelaba ya `BROKER_POR_REGION` en el mock).
-- 2) El directorio de Property Manager / Facility Manager por región
--    (`PM_POR_REGION` / `FACILITY_MANAGER_POR_REGION` en el mock) no tenía
--    tabla — se crea `personal_regional` con el mismo criterio de solo-lectura
--    que `brokers`/`parques`/`contratistas`.

alter table brokers add column region text;

update brokers set region = 'Occidente' where id = 'BRK-01';
update brokers set region = 'Norte' where id = 'BRK-02';
update brokers set region = 'Bajío' where id = 'BRK-03';

alter table brokers alter column region set not null;
alter table brokers add constraint brokers_region_check check (region in ('Bajío', 'Norte', 'Occidente'));
alter table brokers add constraint brokers_region_unique unique (region);

create table personal_regional (
  id text primary key,
  region text not null check (region in ('Bajío', 'Norte', 'Occidente')),
  rol text not null check (rol in ('Property Manager', 'Facility Manager')),
  nombre_completo text not null,
  unique (region, rol)
);

alter table personal_regional enable row level security;

create policy select_personal_regional on personal_regional
  for select using (mi_perfil_activo());

insert into personal_regional (id, region, rol, nombre_completo) values
  ('PM-BAJIO', 'Bajío', 'Property Manager', 'Ing. Paola Reséndiz — PM Regional Bajío'),
  ('PM-NORTE', 'Norte', 'Property Manager', 'Ing. Diego Salcedo — PM Regional Norte'),
  ('PM-OCCIDENTE', 'Occidente', 'Property Manager', 'Arq. Mariana Cobos — PM Regional Occidente'),
  ('FM-BAJIO', 'Bajío', 'Facility Manager', 'Ing. Lorena Ibáñez Cárdenas — Facility Manager Regional Bajío'),
  ('FM-NORTE', 'Norte', 'Facility Manager', 'Ing. Tomás Guerrero — Facility Manager Regional Norte'),
  ('FM-OCCIDENTE', 'Occidente', 'Facility Manager', 'Ing. Héctor Villaseñor Prado — Facility Manager Regional Occidente');
