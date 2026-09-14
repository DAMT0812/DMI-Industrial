# Fase 6a v2 — Base de datos (Supabase)

Esquema alineado al MVP productivo real (folio DMI-0E2EE313): roles y ámbito, documentos
con versionado y excepciones, renovación de contrato, catálogo fijo de 12 sistemas
críticos, bitácora inmutable, comité CapEx con votos, flujo de firmas por importe, etc.
El control de permisos por rol/ámbito (RLS fino) y toda la lógica de flujos se agregan en
fases posteriores (6b en adelante) sobre esta misma base.

Pasos a ejecutar en el **SQL Editor** de tu proyecto de Supabase, en este orden exacto:

1. `migrations/0001_schema.sql` — crea todas las tablas y relaciones.
2. `migrations/0002_rls.sql` — activa seguridad a nivel de fila (RLS).
3. `seed/seed.sql` — carga los datos de ejemplo actuales (los mismos que hoy ves en la maqueta).

Para regenerar `seed/seed.sql` a partir de `src/data/` (por si cambian los datos de ejemplo):

```bash
npx tsx scripts/generate-seed.ts
```

Después de ejecutar los 3 scripts, copia `.env.example` a `.env.local` en la raíz del
proyecto y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de
**Project Settings → API** de tu proyecto de Supabase.
