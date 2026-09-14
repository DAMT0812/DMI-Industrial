-- DMI Industrial — Property Management Platform
-- Fase 6d: bucket privado de Supabase Storage para los archivos reales de documentos
-- del expediente (permisos, pólizas, predial, CFE, agua). Descarga siempre por URL
-- firmada de corta vigencia (5 minutos) generada al vuelo desde el cliente — nunca se
-- guarda una URL pública permanente.

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "authenticated_read_documentos_bucket" on storage.objects
  for select using (bucket_id = 'documentos' and auth.role() = 'authenticated');

create policy "authenticated_upload_documentos_bucket" on storage.objects
  for insert with check (bucket_id = 'documentos' and auth.role() = 'authenticated');

create policy "authenticated_update_documentos_bucket" on storage.objects
  for update using (bucket_id = 'documentos' and auth.role() = 'authenticated')
  with check (bucket_id = 'documentos' and auth.role() = 'authenticated');

-- Sin policy de delete a propósito: los archivos de documentos nunca se borran
-- físicamente (solo se reemplazan, conservando historial en documento_versiones).
