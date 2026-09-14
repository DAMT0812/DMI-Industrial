# Fase 6a v2 — Base de datos (Supabase)

Esquema alineado al MVP productivo real (folio DMI-0E2EE313): roles y ámbito, documentos
con versionado y excepciones, renovación de contrato, catálogo fijo de 12 sistemas
críticos, bitácora inmutable, comité CapEx con votos, flujo de firmas por importe, etc.
El control de permisos por rol/ámbito (RLS fino) y toda la lógica de flujos se agregan en
fases posteriores (6b en adelante) sobre esta misma base.

Migraciones, en orden: `0001_schema.sql` → `0002_rls.sql` → `seed/seed.sql` → `0003_auth_trigger.sql` → `0004_admin_rls.sql` → `0005_fix_admin_rls_recursion.sql`.

## Opción A — línea de comandos (recomendado si ya tienes DATABASE_URL en `.env.local`)

```bash
DATABASE_URL="postgresql://..." npx tsx scripts/run-sql.ts supabase/migrations/0001_schema.sql
```

El connection string está en **Project Settings → Connect → Direct connection (o Session
pooler si te conectas desde una red IPv4)**. Si la contraseña tiene caracteres especiales
(`@`, `#`, etc.) hay que codificarlos en la URL (`@` → `%40`).

## Opción B — SQL Editor de Supabase (copiar/pegar manual)

Abre cada archivo y pégalo en **SQL Editor** de tu proyecto, uno a la vez, en el orden de
arriba.

---

Para regenerar `seed/seed.sql` a partir de `src/data/` (por si cambian los datos de ejemplo):

```bash
npx tsx scripts/generate-seed.ts
```

Después de ejecutar los 3 scripts, copia `.env.example` a `.env.local` en la raíz del
proyecto y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de
**Project Settings → API** de tu proyecto de Supabase.
