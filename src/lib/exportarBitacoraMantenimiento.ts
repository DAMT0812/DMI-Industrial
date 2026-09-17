import { supabase } from '@/lib/supabaseClient'
import type { Contratista, Nave, OrdenTrabajo, ParqueIndustrial } from '@/data/types'

interface DatosExportarBitacoraMantenimiento {
  ordenesCerradas: OrdenTrabajo[]
  naveById: (id: string) => Nave | undefined
  parqueById: (id: string) => ParqueIndustrial | undefined
  contratistaById: (id: string) => Contratista | undefined
}

interface FilaBitacora {
  id: string
  entidad_id: string
  tipo_evento: string
  usuario_id: string | null
  fecha_hora: string
  descripcion: string
}

function finalYDe(doc: unknown): number {
  return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

// PDF real (no maqueta): la tabla de ordenes cerradas viene de ordenes_trabajo (ya
// respaldado por Supabase, mismo dato que se ve en pantalla) y la bitacora se consulta en
// vivo contra la tabla bitacora, filtrada a esta entidad — mismo criterio que BitacoraPage.
export async function exportarBitacoraMantenimientoPdf(datos: DatosExportarBitacoraMantenimiento) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const { data: eventos } = await supabase
    .from('bitacora')
    .select('id, entidad_id, tipo_evento, usuario_id, fecha_hora, descripcion')
    .eq('entidad', 'ordenes_trabajo')
    .order('fecha_hora', { ascending: false })
    .limit(200)

  const idsUsuarios = [...new Set((eventos ?? []).map((e) => (e as FilaBitacora).usuario_id).filter((id): id is string => Boolean(id)))]
  let nombresPorId: Record<string, string> = {}
  if (idsUsuarios.length > 0) {
    const { data: perfiles } = await supabase.from('profiles').select('id, nombre').in('id', idsUsuarios)
    nombresPorId = Object.fromEntries((perfiles ?? []).map((p) => [(p as { id: string }).id, (p as { nombre: string }).nombre]))
  }

  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Bitácora de Mantenimiento — DMI Industrial', 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generado ${new Date().toLocaleString('es-MX')}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Folio', 'Nave', 'Categoría', 'Contratista', 'Costo (USD)', 'Estatus', 'Fecha de Cierre']],
    body: datos.ordenesCerradas.map((o) => {
      const nave = datos.naveById(o.naveId)
      const parque = nave ? datos.parqueById(nave.parqueId) : undefined
      const contratista = datos.contratistaById(o.contratistaId)
      return [
        o.folio,
        nave ? `${parque?.nombre ?? ''} — ${nave.folio}` : o.naveId,
        o.categoria,
        contratista?.nombre ?? o.contratistaId,
        o.costoEstimado.toLocaleString('es-MX'),
        o.estatus,
        o.fechaCierre ?? '—',
      ]
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [36, 51, 63] },
  })

  const y2 = finalYDe(doc) + 10
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Bitácora de eventos (últimos 200)', 14, y2)

  autoTable(doc, {
    startY: y2 + 4,
    head: [['Fecha y hora', 'Usuario', 'Orden', 'Evento', 'Descripción']],
    body: (eventos ?? []).map((e) => {
      const fila = e as FilaBitacora
      return [
        new Date(fila.fecha_hora).toLocaleString('es-MX'),
        fila.usuario_id ? (nombresPorId[fila.usuario_id] ?? '—') : 'Sistema',
        fila.entidad_id,
        fila.tipo_evento,
        fila.descripcion,
      ]
    }),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [36, 51, 63] },
  })

  doc.save(`bitacora-mantenimiento-${new Date().toISOString().slice(0, 10)}.pdf`)
}
