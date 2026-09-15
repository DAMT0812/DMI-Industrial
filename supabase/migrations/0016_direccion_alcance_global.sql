-- Fase 7a (Subfase 1/4 de la auditoria de administracion empresarial): la Seccion 16
-- de la auditoria marco como "faltante critico" que el rol Direccion no tenia alcance
-- global automatico -- dependia de que un admin marcara acceso_total=true a mano en su
-- perfil, exactamente igual que un Property Manager o Facility Manager cualquiera. El
-- nombre del rol ("Direccion") implica supervision de toda la operacion por definicion,
-- asi que se le da el mismo bypass regional que ya tiene Superadministrador desde 0013.
--
-- Direccion NO gana privilegios de administracion del sistema (alta/edicion de usuarios,
-- roles) -- eso sigue siendo exclusivo de Administrador del Sistema/Superadministrador
-- via es_administrador_del_sistema(); este cambio es puramente de alcance regional de
-- lectura (que naves/parques/documentos/ordenes puede VER), no de permisos de escritura.

create or replace function public.mi_ambito_permite(p_region text)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles pr
    where pr.id = auth.uid() and pr.activo
      and (pr.acceso_total or pr.rol in ('Superadministrador', 'Dirección') or p_region = any(pr.ambito_regiones))
  );
$$;
