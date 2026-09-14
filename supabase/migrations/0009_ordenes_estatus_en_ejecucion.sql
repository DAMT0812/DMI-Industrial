-- DMI Industrial — Property Management Platform
-- Fase 6h: el esquema llamaba 'En Proceso' al estado activo de una orden de trabajo,
-- pero la app (maqueta y UI) siempre usó 'En ejecución' — mismo desajuste de vocabulario
-- que contratos.vigencia en la Fase 6g. Se alinea el esquema a lo que la app usa de verdad.

alter table ordenes_trabajo drop constraint ordenes_trabajo_estatus_check;

update ordenes_trabajo set estatus = 'En ejecución' where estatus = 'En Proceso';

alter table ordenes_trabajo add constraint ordenes_trabajo_estatus_check
  check (estatus in ('Abierta', 'En ejecución', 'Esperando Refacción', 'Pendiente de Evidencia', 'Validado', 'Cancelada'));
