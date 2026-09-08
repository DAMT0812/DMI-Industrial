import type { TareaViva } from './types'
import { ordenesTrabajo } from './ordenesTrabajo'
import { contratistaById } from './contratistas'

// Deriva el flujo de "Tareas Vivas" directamente de las órdenes de trabajo reales
// (misma fuente que el Tablero CMMS) para que ambos tableros nunca queden desincronizados.
export const tareasVivas: TareaViva[] = ordenesTrabajo.map((o, idx) => {
  const contratista = contratistaById(o.contratistaId)
  let columna: TareaViva['columna']
  let avancePct: number | null = null
  let estatusCierre: TareaViva['estatusCierre'] = null

  if (o.estatus === 'Cerrada') {
    columna = 'completada'
    estatusCierre = idx % 3 === 0 ? 'Facturado' : 'Cerrado & Auditado'
  } else if (o.estatus === 'Abierta' && (o.prioridad === 'Crítica' || o.prioridad === 'Alta')) {
    columna = 'urgente'
  } else {
    columna = 'en-ejecucion'
    avancePct = 25 + ((idx * 13) % 60)
  }

  return {
    id: `TV-${o.id}`,
    titulo: o.descripcion,
    naveId: o.naveId,
    categoria: o.categoria,
    responsable: contratista?.nombre ?? 'Por asignar',
    columna,
    avancePct,
    estatusCierre,
  } satisfies TareaViva
})

export const tareasVivasPorColumna = (columna: TareaViva['columna']) => tareasVivas.filter((t) => t.columna === columna)
