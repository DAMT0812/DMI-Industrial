-- Fase 6l: el disparador de alta de perfil (0003_auth_trigger.sql) solo conocía la
-- convención de correo/contraseña (raw_user_meta_data->>'nombre', puesta por signUp()).
-- Un alta vía SSO de Microsoft Entra ID no manda esa clave — Supabase guarda el nombre
-- que entrega Microsoft como 'full_name' o 'name' — así que se amplía el fallback para
-- que un usuario que entra por primera vez con SSO también quede con un nombre legible
-- en vez de perder el N sobre correo@dominio.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_resuelto text := coalesce(
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, nombre, correo, puesto, rol, avatar_iniciales)
  values (
    new.id,
    nombre_resuelto,
    new.email,
    'Por asignar',
    'Property Manager',
    upper(left(nombre_resuelto, 2))
  );
  return new;
end;
$$;
