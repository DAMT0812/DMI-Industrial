-- DMI Industrial — Property Management Platform
-- Fase 6b: al crearse un usuario en auth.users (login/registro con Supabase Auth),
-- se crea automáticamente su fila en profiles con un rol/ámbito por defecto.
-- Un Administrador del Sistema ajusta después el rol y el ámbito reales (Fase 6c).
--
-- Ejecutar en el SQL Editor de Supabase después de 0001_schema.sql y 0002_rls.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, correo, puesto, rol, avatar_iniciales)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    'Por asignar',
    'Property Manager',
    upper(left(coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)), 2))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
