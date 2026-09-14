import type { EstatusOperativo, Nave, ParqueIndustrial } from '@/data'
import { derivarCamposNave } from './naveDefaults'

// Importación masiva de naves desde Excel (Fase 6k). Los encabezados de la plantilla se
// generan sin acentos a propósito — se comparan normalizados (sin acentos, minúsculas,
// espacios colapsados) contra los encabezados reales del archivo, así que variaciones
// menores de mayúsculas/acentos/espacios siguen funcionando aunque el usuario edite la
// plantilla en Excel.
//
// `xlsx` se importa de forma dinámica dentro de cada función (no en el top-level): es
// una librería pesada que solo hace falta al importar o descargar la plantilla, no en
// cada carga de la app — evita inflar el bundle principal que se descarga siempre.

const TIPOS_PROPIEDAD: Nave['tipoPropiedad'][] = ['Nave Industrial', 'Bodega Logística', 'Terreno', 'Nave BTS']
const CLASES_ACTIVO: Nave['claseActivo'][] = ['Clase A', 'Clase B']
const ESTATUS_OPERATIVOS: EstatusOperativo[] = ['Óptimo Operativo', 'Alerta Predial Pendiente', 'En Renovación Formal', 'Mant. Preventivo HVAC', 'En Mora']
const CERTIFICACIONES_LEED = ['LEED Silver', 'LEED Gold', 'LEED Platinum'] as const

const CAMPOS_NUMERICOS = [
  'lat',
  'lng',
  'superficieTerreno',
  'superficieConstruccion',
  'gla',
  'areaOficinas',
  'alturaLibre',
  'numeroAndenes',
  'numeroRampas',
  'capacidadElectrica',
  'cumplimientoSTPS',
] as const

interface ColumnaDef {
  clave: string
  encabezado: string
  requerido: boolean
}

const COLUMNAS: ColumnaDef[] = [
  { clave: 'folio', encabezado: 'Folio', requerido: true },
  { clave: 'parque', encabezado: 'Parque Industrial', requerido: true },
  { clave: 'numeroNave', encabezado: 'Numero de Nave', requerido: true },
  { clave: 'direccion', encabezado: 'Direccion', requerido: true },
  { clave: 'lat', encabezado: 'Latitud', requerido: true },
  { clave: 'lng', encabezado: 'Longitud', requerido: true },
  { clave: 'tipoPropiedad', encabezado: 'Tipo de Propiedad', requerido: false },
  { clave: 'claseActivo', encabezado: 'Clase de Activo', requerido: false },
  { clave: 'estatusOperativo', encabezado: 'Estatus Operativo', requerido: false },
  { clave: 'superficieTerreno', encabezado: 'Superficie Terreno m2', requerido: true },
  { clave: 'superficieConstruccion', encabezado: 'Superficie Construccion m2', requerido: true },
  { clave: 'gla', encabezado: 'GLA m2', requerido: true },
  { clave: 'areaOficinas', encabezado: 'Area de Oficinas m2', requerido: true },
  { clave: 'alturaLibre', encabezado: 'Altura Libre m', requerido: true },
  { clave: 'pisoFFFL', encabezado: 'Piso FF/FL', requerido: true },
  { clave: 'numeroAndenes', encabezado: 'Numero de Andenes', requerido: true },
  { clave: 'numeroRampas', encabezado: 'Numero de Rampas', requerido: true },
  { clave: 'capacidadElectrica', encabezado: 'Capacidad Electrica KVA', requerido: true },
  { clave: 'cumplimientoSTPS', encabezado: 'Cumplimiento STPS pct', requerido: true },
  { clave: 'certificacionLEED', encabezado: 'Certificacion LEED', requerido: false },
  { clave: 'certificacionESG', encabezado: 'Certificacion ESG', requerido: false },
]

// `s` puede llegar `undefined` en la práctica aunque el tipo de `fila` diga `string`:
// una columna opcional (tipoPropiedad, claseActivo, certificacionLEED, etc.) que el
// usuario omite por completo en su archivo nunca se asigna en `filaNormalizada`, así que
// leerla da `undefined` en tiempo de ejecución pese al `Record<string, string>`.
function normalizar(s: string | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const ENCABEZADO_A_CLAVE = new Map(COLUMNAS.map((c) => [normalizar(c.encabezado), c.clave]))

export async function leerFilasDeArchivo(archivo: File): Promise<Record<string, unknown>[]> {
  const [XLSX, buffer] = await Promise.all([import('xlsx'), archivo.arrayBuffer()])
  const libro = XLSX.read(buffer, { type: 'array' })
  const hoja = libro.Sheets[libro.SheetNames[0]]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' })
}

function filaNormalizada(filaCruda: Record<string, unknown>): Partial<Record<string, string>> {
  const fila: Partial<Record<string, string>> = {}
  for (const [encabezado, valor] of Object.entries(filaCruda)) {
    const clave = ENCABEZADO_A_CLAVE.get(normalizar(encabezado))
    if (clave) fila[clave] = String(valor ?? '').trim()
  }
  return fila
}

export interface FilaImportada {
  numeroFila: number // fila real dentro del archivo Excel (incluye encabezado)
  folio: string
  nave: Nave | null
  errores: string[]
}

export function parsearFilasNaves(
  filasCrudas: Record<string, unknown>[],
  contexto: { parques: ParqueIndustrial[]; navesExistentes: Nave[] },
): FilaImportada[] {
  const foliosVistosEnArchivo = new Set<string>()

  return filasCrudas.map((filaCruda, idx) => {
    const fila = filaNormalizada(filaCruda)
    const errores: string[] = []

    for (const col of COLUMNAS) {
      if (col.requerido && !fila[col.clave]) errores.push(`Falta "${col.encabezado}"`)
    }

    const folio = fila.folio ?? ''
    if (folio) {
      if (foliosVistosEnArchivo.has(folio.toLowerCase())) errores.push(`Folio "${folio}" repetido en el archivo`)
      if (contexto.navesExistentes.some((n) => n.folio.toLowerCase() === folio.toLowerCase())) {
        errores.push(`Folio "${folio}" ya existe en el portafolio`)
      }
    }

    const parque = fila.parque ? contexto.parques.find((p) => normalizar(p.nombre) === normalizar(fila.parque)) : undefined
    if (fila.parque && !parque) errores.push(`Parque "${fila.parque}" no reconocido`)

    const numeros: Record<string, number> = {}
    for (const clave of CAMPOS_NUMERICOS) {
      const crudo = fila[clave]
      if (!crudo) continue
      const n = Number(crudo.replace(',', '.'))
      if (Number.isNaN(n)) errores.push(`"${crudo}" no es un número válido en la columna correspondiente a "${clave}"`)
      else numeros[clave] = n
    }

    if (errores.length > 0 || !parque) {
      return { numeroFila: idx + 2, folio, nave: null, errores }
    }

    foliosVistosEnArchivo.add(folio.toLowerCase())

    const tipoPropiedad = TIPOS_PROPIEDAD.find((t) => normalizar(t) === normalizar(fila.tipoPropiedad)) ?? 'Nave Industrial'
    const claseActivo = CLASES_ACTIVO.find((c) => normalizar(c) === normalizar(fila.claseActivo)) ?? 'Clase A'
    const estatusOperativo = ESTATUS_OPERATIVOS.find((e) => normalizar(e) === normalizar(fila.estatusOperativo)) ?? 'Óptimo Operativo'
    const certificacionLEED = CERTIFICACIONES_LEED.find((c) => normalizar(c) === normalizar(fila.certificacionLEED)) ?? null
    const certificacionESG = ['si', 'sí', 'true', '1', 'x'].includes(normalizar(fila.certificacionESG))

    // Los `!` son seguros: numeroNave/direccion/pisoFFFL están en COLUMNAS como
    // requeridos, y el bloque de arriba ya retornó temprano si faltaban.
    const camposBase = {
      folio,
      parqueId: parque.id,
      numeroNave: fila.numeroNave!,
      direccion: fila.direccion!,
      coordenadas: { lat: numeros.lat, lng: numeros.lng },
      tipoPropiedad,
      claseActivo,
      estatusOperativo,
      superficieTerreno: numeros.superficieTerreno,
      superficieConstruccion: numeros.superficieConstruccion,
      gla: numeros.gla,
      areaOficinas: numeros.areaOficinas,
      alturaLibre: numeros.alturaLibre,
      numeroAndenes: numeros.numeroAndenes,
      numeroRampas: numeros.numeroRampas,
      capacidadElectrica: numeros.capacidadElectrica,
      pisoFFFL: fila.pisoFFFL!,
      certificacionLEED,
      certificacionESG,
      cumplimientoSTPS: numeros.cumplimientoSTPS,
    }

    const nave: Nave = {
      id: `NAVE-NEW-${Date.now()}-${idx}`,
      ...derivarCamposNave(camposBase),
      ocupada: false,
      fechaEntrega: new Date().toISOString().slice(0, 10),
      ...camposBase,
    }

    return { numeroFila: idx + 2, folio, nave, errores: [] }
  })
}

export async function descargarPlantillaNaves() {
  const XLSX = await import('xlsx')
  const encabezados = COLUMNAS.map((c) => c.encabezado)
  const ejemplo = [
    'DMI-JAL-EJM-N01',
    'Parque Industrial DMI El Salto',
    '01',
    'Av. Ejemplo 123, El Salto, Jalisco, C.P. 45680',
    '20.5236',
    '-103.1922',
    'Nave Industrial',
    'Clase A',
    'Óptimo Operativo',
    '20000',
    '12000',
    '11000',
    '600',
    '11',
    'FF 50 / FL 75',
    '4',
    '2',
    '800',
    '95',
    '',
    'No',
  ]
  const hoja = XLSX.utils.aoa_to_sheet([encabezados, ejemplo])
  hoja['!cols'] = encabezados.map((e) => ({ wch: Math.max(e.length, 14) }))
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Naves')
  XLSX.writeFile(libro, 'plantilla-naves-dmi.xlsx')
}
