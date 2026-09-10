import type { TareaViva } from './types'
import { ordenesTrabajo } from './ordenesTrabajo'
import { contratistaById } from './contratistas'

// Deriva el flujo de "Tareas Vivas" directamente de las órdenes de trabajo reales
// (misma fuente que el Tablero CMMS) para que ambos tableros nunca queden desincronizados.
// Una orden Cancelada sale del flujo de Tareas Vivas por completo — no debe seguir
// contando como pendiente ni ocupar ninguna de las tres columnas.
export function calcularTareasVivas(ordenesInput: typeof ordenesTrabajo = ordenesTrabajo): TareaViva[] {
  return ordenesInput
    .filter((o) => o.estatus !== 'Cancelada')
    .map((o, idx) => {
      const contratista = contratistaById(o.contratistaId)
      let columna: TareaViva['columna']
      let avancePct: number | null = null
      let estatusCierre: TareaViva['estatusCierre'] = null

      if (o.estatus === 'Validado') {
        columna = 'completada'
        estatusCierre = idx % 3 === 0 ? 'Facturado' : 'Cerrado & Auditado'
      } else if (o.estatus === 'Abierta' && (o.prioridad === 'Crítica' || o.prioridad === 'Alta')) {
        columna = 'urgente'
      } else {
        columna = 'en-ejecucion'
        avancePct = o.estatus === 'Pendiente de Evidencia' ? 100 : 25 + ((idx * 13) % 60)
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
}

export const tareasVivas: TareaViva[] = calcularTareasVivas()

export const tareasVivasPorColumna = (columna: TareaViva['columna'], tareasInput: TareaViva[] = tareasVivas) =>
  tareasInput.filter((t) => t.columna === columna)
