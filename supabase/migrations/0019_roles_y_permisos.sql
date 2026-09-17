-- Fase 7a (Subfase 4/4, Punto de control 1/3): roles y permisos como catalogo en base de
-- datos, en vez de una union fija de TypeScript + comparaciones de string hardcodeadas en
-- permissions.ts y en cada policy de RLS.
--
-- Este archivo SOLO crea el esquema nuevo y siembra los datos -- NO toca ninguna policy
-- existente todavia (eso es el Punto de control 2, en una migracion separada). Mientras
-- tanto las policies viejas (con sus listas de rol literales) siguen mandando exactamente
-- igual que antes; tiene_permiso() se puede verificar en paralelo sin ningun riesgo de
-- romper acceso real.
--
-- Los 6 roles actuales quedan marcados es_sistema=true: no se pueden eliminar ni renombrar
-- (ver RolesPage.tsx en el Punto de control 3) porque sus nombres literales siguen usados
-- como valor de profiles.rol. Administrador del Sistema/Superadministrador NO entran a esta
-- tabla como permisos otorgables -- es_administrador_del_sistema() sigue siendo un chequeo
-- de rol hardcodeado a proposito (ver Contexto del plan): son las dos funciones "raiz" que
-- administran el propio sistema de permisos, y no pueden depender de la tabla que administran.

create table roles (
  nombre text primary key,
  es_sistema boolean not null default false,
  creado_en timestamptz not null default now()
);

create table permisos_por_rol (
  rol text not null references roles(nombre) on update cascade on delete cascade,
  permiso text not null,
  primary key (rol, permiso)
);

alter table roles enable row level security;
alter table permisos_por_rol enable row level security;

create policy select_roles on roles for select using (mi_perfil_activo());
create policy write_roles on roles for all using (es_administrador_del_sistema()) with check (es_administrador_del_sistema());

create policy select_permisos_por_rol on permisos_por_rol for select using (mi_perfil_activo());
create policy write_permisos_por_rol on permisos_por_rol for all using (es_administrador_del_sistema()) with check (es_administrador_del_sistema());

-- tiene_permiso(): Superadministrador siempre pasa (bypass, igual que en permissions.ts);
-- cualquier otro rol depende de si existe la fila (rol, permiso) en permisos_por_rol.
-- Reutiliza mi_rol(), que ya filtra activo/bloqueado/eliminado (0017).
create or replace function public.tiene_permiso(p_permiso text)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select public.mi_rol() = 'Superadministrador'
    or exists (select 1 from permisos_por_rol where rol = public.mi_rol() and permiso = p_permiso);
$$;

insert into roles (nombre, es_sistema) values
  ('Property Manager', true),
  ('Facility Manager', true),
  ('Dirección', true),
  ('Contabilidad', true),
  ('Administrador del Sistema', true),
  ('Superadministrador', true);

-- Semilla: reconstruccion exacta de las policies/funciones de permissions.ts actuales,
-- derivada directamente del inventario de las 18 migraciones previas (no de una relectura
-- superficial). Superadministrador no necesita filas aqui -- tiene_permiso() ya lo cubre.
insert into permisos_por_rol (rol, permiso) values
  ('Property Manager', 'alta_nave'),
  ('Property Manager', 'editar_nave'),
  ('Facility Manager', 'editar_nave'),

  -- escribir_orden: solo para RLS de ordenes_trabajo/ordenes_pausas/ordenes_evidencia --
  -- esas policies hoy aceptan Property Manager a nivel de base de datos aunque el boton
  -- "Editar orden" del cliente (editar_orden) solo lo ve Facility Manager. Se preserva esa
  -- discrepancia existente tal cual, sin ensancharla ni corregirla en esta migracion.
  ('Property Manager', 'escribir_orden'),
  ('Facility Manager', 'escribir_orden'),

  ('Facility Manager', 'editar_orden'),
  ('Facility Manager', 'validar_cierre_orden'),

  ('Property Manager', 'editar_tarea'),
  ('Facility Manager', 'editar_tarea'),

  ('Property Manager', 'ver_contrato'),
  ('Dirección', 'ver_contrato'),
  ('Contabilidad', 'ver_contrato'),

  ('Property Manager', 'editar_contrato'),
  ('Dirección', 'resolver_renovacion'),

  ('Property Manager', 'editar_documento_obra'),
  ('Facility Manager', 'editar_documento_obra'),

  ('Property Manager', 'editar_documento_predial_cfe'),
  ('Contabilidad', 'editar_documento_predial_cfe'),

  ('Property Manager', 'editar_capex'),
  ('Facility Manager', 'editar_capex'),
  ('Dirección', 'resolver_capex'),
  ('Dirección', 'votar_capex'),

  ('Administrador del Sistema', 'ver_bitacora'),
  ('Dirección', 'ver_bitacora');
