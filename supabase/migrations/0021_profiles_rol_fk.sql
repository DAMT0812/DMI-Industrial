-- Fase 7a (Subfase 4/4, Punto de control 3/3): 0019 creo la tabla roles pero se me olvido
-- este paso -- profiles.rol seguia con el check constraint original de 6 valores fijos, asi
-- que ningun perfil podia asignarse a un rol nuevo creado desde /admin/roles (se reprodujo
-- el error real al intentarlo: "violates check constraint profiles_rol_check").
--
-- Sin "on delete" -> Postgres bloquea por defecto eliminar un rol con perfiles asignados
-- (RESTRICT implicito), igual que ya se documento en el plan original de esta subfase.

alter table profiles drop constraint profiles_rol_check;
alter table profiles add constraint profiles_rol_fkey foreign key (rol) references roles(nombre) on update cascade;
