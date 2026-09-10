import { ordenesTrabajo } from './ordenesTrabajo'
import { proyectosCapex, capexAutorizadoTotal } from './proyectosCapex'
import { diasEntre } from '../lib/dates'
import type { OrdenTrabajo, ProyectoCapex } from './types'

export const PM_CUMPLIDAS = 118
export const PM_META_ANUAL = 125
export const pmCumplimientoPct = () => Math.round((PM_CUMPLIDAS / PM_META_ANUAL) * 1000) / 10

export const correctivosActivos = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) => {
  const abiertas = ordenesInput.filter((o) => o.estatus !== 'Validado' && o.estatus !== 'Cancelada')
  return {
    total: abiertas.length,
    alta: abiertas.filter((o) => o.prioridad === 'Crítica' || o.prioridad === 'Alta').length,
    media: abiertas.filter((o) => o.prioridad === 'Media').length,
    baja: abiertas.filter((o) => o.prioridad === 'Baja').length,
  }
}

export const OPEX_PRESUPUESTO_ANUAL_USD = 4_200_000
export const OPEX_EJECUTADO_YTD_USD = 2_890_000
export const opexEjecutadoPct = () => Math.round((OPEX_EJECUTADO_YTD_USD / OPEX_PRESUPUESTO_ANUAL_USD) * 1000) / 10

export const capexProyectosMayores = (proyectosInput: ProyectoCapex[] = proyectosCapex) =>
  proyectosInput.filter((p) => p.estatusComite === 'Aprobado por Dirección' || p.estatusComite === 'En Ejecución').length

export const capexAutorizadoAnio = (proyectosInput: ProyectoCapex[] = proyectosCapex) => capexAutorizadoTotal(proyectosInput)

export const SLA_META_HORAS = 36

export const slaPromedioResolucionHoras = (ordenesInput: OrdenTrabajo[] = ordenesTrabajo) => {
  const cerradas = ordenesInput.filter((o) => o.estatus === 'Validado' && o.fechaCierre)
  if (cerradas.length === 0) return 0
  const totalHoras = cerradas.reduce((acc, o) => acc + diasEntre(new Date(o.fechaCreacion), o.fechaCierre!) * 24, 0)
  return Math.round(totalHoras / cerradas.length)
}

export const proyectoMayorEnCurso = (proyectosInput: ProyectoCapex[] = proyectosCapex) =>
  proyectosInput.find((p) => p.estatusComite === 'En Ejecución') ?? null
