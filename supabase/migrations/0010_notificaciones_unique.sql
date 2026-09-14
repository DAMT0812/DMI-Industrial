-- Fase 6j: evita notificaciones duplicadas. El disparo automático corre en el cliente y
-- react a varias cargas independientes (documentos/contratos/ordenes/perfiles), así que
-- el mismo umbral puede intentar dispararse más de una vez antes de que el insert previo
-- se refleje en el estado local; el unique constraint es la garantía real, no el chequeo
-- en memoria (que solo evita llamadas redundantes en el caso normal).
alter table notificaciones
  add constraint notificaciones_entidad_destinatario_unique unique (entidad_relacionada, destinatario_id);
