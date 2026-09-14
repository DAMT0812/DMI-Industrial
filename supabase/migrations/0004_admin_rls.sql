-- DMI Industrial — Property Management Platform
-- Fase 6c: un Administrador del Sistema puede administrar el rol y ámbito de
-- cualquier usuario interno (alta de perfil ya cubierta por el trigger de 0003;
-- esto habilita editar rol/región/activo de OTROS usuarios, no solo el propio).
--
-- Ejecutar en el SQL Editor de Supabase después de 0001, 0002 y 0003.

create policy "admin_manage_profiles" on profiles
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.rol = 'Administrador del Sistema'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.rol = 'Administrador del Sistema'));

-- La policy "self_update_profiles" (0002) deja que cada quien edite su propia fila,
-- lo cual sin más controles permitiría auto-otorgarse rol de Administrador del Sistema
-- o cambiar su propio ámbito. Este trigger revierte cualquier cambio a los campos de
-- privilegio salvo que quien ejecuta ya sea Administrador del Sistema, o la operación
-- venga del SQL Editor / service role (sin JWT de usuario, auth.uid() es null) — así
-- el primer administrador se puede dar de alta a mano por SQL.
create or replace function public.proteger_campos_privilegio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not exists (select 1 from profiles p where p.id = auth.uid() and p.rol = 'Administrador del Sistema') then
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

create trigger before_update_profiles_proteger_privilegio
  before update on profiles
  for each row execute function public.proteger_campos_privilegio();
