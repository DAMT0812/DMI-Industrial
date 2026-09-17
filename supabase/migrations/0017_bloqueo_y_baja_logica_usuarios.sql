-- Fase 7a (Subfase 2/4): ciclo de vida de usuario -- bloqueo/desbloqueo distinto de
-- desactivar, y baja logica distinta de ambos (Seccion 16 de la auditoria).
--
-- - `bloqueado`: corte de acceso manual (p.ej. incidente de seguridad), reversible por un
--   admin, independiente de `activo` -- un usuario puede estar activo=true y bloqueado=true
--   a la vez (la cuenta "existe" y esta vigente, pero temporalmente sin acceso).
-- - `eliminado`: baja logica -- nunca se borra la fila fisicamente. Distinto de desactivar
--   en que ademas se oculta del listado por defecto en Administracion de Usuarios y no se
--   reactiva con el mismo checkbox de "Activo" (requiere una accion explicita de restaurar).
--
-- Las cuatro funciones de autorizacion que dependian solo de `activo` ahora tambien exigen
-- `not bloqueado and not eliminado` -- de lo contrario bloquear/eliminar a alguien no le
-- quitaria acceso real, solo lo ocultaria en el panel de admin.

alter table profiles add column bloqueado boolean not null default false;
alter table profiles add column eliminado boolean not null default false;

create or replace function public.mi_perfil_activo()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select coalesce((select activo and not bloqueado and not eliminado from profiles where id = auth.uid()), false);
$$;

create or replace function public.mi_ambito_permite(p_region text)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles pr
    where pr.id = auth.uid() and pr.activo and not pr.bloqueado and not pr.eliminado
      and (pr.acceso_total or pr.rol in ('Superadministrador', 'Dirección') or p_region = any(pr.ambito_regiones))
  );
$$;

create or replace function public.mi_rol()
returns text
language sql
stable security definer
set search_path = public
as $$
  select rol from profiles where id = auth.uid() and activo and not bloqueado and not eliminado;
$$;

-- es_administrador_del_sistema() nunca habia filtrado por activo (comentario original en
-- 0005 solo hablaba de evitar recursion de RLS) -- un Administrador del Sistema desactivado
-- conservaba sus privilegios de administracion. Se corrige de paso, junto con bloqueado/eliminado.
create or replace function public.es_administrador_del_sistema()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.activo and not p.bloqueado and not p.eliminado
      and p.rol in ('Administrador del Sistema', 'Superadministrador')
  );
$$;
