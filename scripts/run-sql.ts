// Ejecuta un archivo .sql contra la base de datos de Supabase del proyecto.
// Uso: DATABASE_URL="postgresql://..." npx tsx scripts/run-sql.ts supabase/migrations/0001_schema.sql
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

const archivo = process.argv[2]
if (!archivo) {
  console.error('Uso: npx tsx scripts/run-sql.ts <archivo.sql>')
  process.exit(1)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Falta DATABASE_URL en el entorno.')
  process.exit(1)
}

const sql = readFileSync(archivo, 'utf-8')
const client = new Client({ connectionString })

async function run() {
  await client.connect()
  try {
    const resultado = await client.query(sql)
    const resultados = Array.isArray(resultado) ? resultado : [resultado]
    for (const r of resultados) {
      if (r.rows && r.rows.length > 0) console.table(r.rows)
    }
    console.log(`OK: ${archivo}`)
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error(`ERROR en ${archivo}:`, err.message)
  process.exit(1)
})
