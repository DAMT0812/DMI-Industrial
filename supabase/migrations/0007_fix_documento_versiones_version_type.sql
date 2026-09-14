-- DMI Industrial — Property Management Platform
-- Fase 6d: documento_versiones.version se definió como integer (0001_schema.sql),
-- pero el cliente usa Date.now() (epoch en milisegundos) para no tener que hacer una
-- consulta extra por el conteo de versiones previas — eso desborda un integer de 32
-- bits. Se amplía a bigint.

alter table documento_versiones alter column version type bigint;
