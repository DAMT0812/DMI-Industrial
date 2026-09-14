-- DMI Industrial — Property Management Platform
-- Fase 6g: contratos.vigencia solo contemplaba el ciclo de vida contractual
-- (Vigente / Terminación Programada / Vencido / Terminado). Un contrato en mora
-- por impago es un estado real del arrendamiento, distinto del flujo de
-- renovación (que vive en la tabla renovaciones) — se agrega aquí.

alter table contratos drop constraint contratos_vigencia_check;

alter table contratos add constraint contratos_vigencia_check
  check (vigencia in ('Vigente', 'Terminación Programada', 'Vencido', 'Terminado', 'En Mora'));
