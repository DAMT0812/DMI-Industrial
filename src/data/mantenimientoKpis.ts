import { ordenesTrabajo } from './ordenesTrabajo'
import { proyectosCapex, capexAutorizadoTotal } from './proyectosCapex'
import { diasEntre } from '../lib/dates'
import type { OrdenTrabajo, ProyectoCapex } from './types'

// Fase 6t: "Cumplimiento PM" no tenía una fuente real honesta — nada en el esquema
// rastrea "mantenimientos programados este año" como tal, y las categorías reales más
// cercanas (tareas_operativas con categoria='Preventivo') son solo 2 de 16 registros,
// una muestra demasiado chica para decir algo. Se redefine como el cierre real de
// órdenes de trabajo de mantenimiento: cuántas ya quedaron Validadas sobre el total.
export const ordenesValidadas = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) => ordenesInput.filter((o) => o.estatus === 'Validado').length

export const ordenesValidadasPct = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) =>
  ordenesInput.length === 0 ? 0 : Math.round((ordenesValidadas(ordenesInput) / ordenesInput.length) * 1000) / 10

export const correctivosActivos = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) => {
  const abiertas = ordenesInput.filter((o) => o.estatus !== 'Validado' && o.estatus !== 'Cancelada')
  return {
    total: abiertas.length,
    alta: abiertas.filter((o) => o.prioridad === 'Crítica' || o.prioridad === 'Alta').length,
    media: abiertas.filter((o) => o.prioridad === 'Media').length,
    baja: abiertas.filter((o) => o.prioridad === 'Baja').length,
  }
}

// El ejecutado: suma de costoEstimado de toda orden que no se canceló (una cancelada
// nunca incurrió gasto), usando el estimado como aproximación ya que el esquema no
// guarda un costo real facturado por separado. El presupuesto anual (meta) vive en
// `parametros_configurables` (Fase 6v) — 4_200_000 abajo es solo el valor de respaldo
// si ese fetch no ha resuelto aún.
export const opexEjecutadoUSD = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) =>
  ordenesInput.filter((o) => o.estatus !== 'Cancelada').reduce((acc, o) => acc + o.costoEstimado, 0)

export const opexEjecutadoPct = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo, opexPresupuestoAnualUSD = 4_200_000) =>
  Math.round((opexEjecutadoUSD(ordenesInput) / opexPresupuestoAnualUSD) * 1000) / 10

export const capexProyectosMayores = (proyectosInput: ProyectoCapex[] = proyectosCapex) =>
  proyectosInput.filter((p) => p.estatusComite === 'Aprobado por Dirección' || p.estatusComite === 'En Ejecución').length

export const capexAutorizadoAnio = (proyectosInput: ProyectoCapex[] = proyectosCapex) => capexAutorizadoTotal(proyectosInput)

export const slaPromedioResolucionHoras = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) => {
  const cerradas = ordenesInput.filter((o) => o.estatus === 'Validado' && o.fechaCierre)
  if (cerradas.length === 0) return 0
  const totalHoras = cerradas.reduce((acc, o) => acc + diasEntre(new Date(o.fechaCreacion), o.fechaCierre!) * 24, 0)
  return Math.round(totalHoras / cerradas.length)
}

export const proyectoMayorEnCurso = (proyectosInput: ProyectoCapex[] = proyectosCapex) =>
  proyectosInput.find((p) => p.estatusComite === 'En Ejecución') ?? null
