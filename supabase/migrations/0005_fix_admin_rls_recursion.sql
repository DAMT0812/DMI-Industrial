-- DMI Industrial — Property Management Platform
-- Fase 6c: corrige recursión infinita en la policy "admin_manage_profiles" de 0004.
--
-- La policy original hacía "select ... from profiles" dentro de su propia condición,
-- lo que Postgres detecta como recursión (error 42P17) al evaluar RLS sobre la misma
-- tabla. La solución estándar es envolver el chequeo en una función `security definer`
-- (dueña de un rol que hace bypass de RLS, como "postgres"), para que la consulta
-- interna no vuelva a disparar las policies de "profiles".

create or replace function public.es_administrador_del_sistema()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.rol = 'Administrador del Sistema');
$$;

drop policy if exists "admin_manage_profiles" on profiles;

create policy "admin_manage_profiles" on profiles
  for all
  using (public.es_administrador_del_sistema())
  with check (public.es_administrador_del_sistema());
