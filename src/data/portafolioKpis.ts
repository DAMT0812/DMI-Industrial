import { naves } from './naves'
import { contratos } from './contratos'
import { inquilinos, inquilinoPorNaveId } from './inquilinos'
import type { Industria } from './types'

export const totalNaves = () => naves.length
export const navesOcupadas = () => naves.filter((n) => n.ocupada).length
export const ocupacionGlobalPct = () => Math.round((navesOcupadas() / totalNaves()) * 1000) / 10

export const glaTotal = () => naves.reduce((acc, n) => acc + n.gla, 0)
export const glaDisponible = () => naves.filter((n) => !n.ocupada).reduce((acc, n) => acc + n.gla, 0)

export const ingresoMensualTotalUSD = () => contratos.reduce((acc, c) => acc + c.rentaBaseMensual + c.cam, 0)

export const PRESUPUESTO_MENSUAL_USD = 1_905_000
export const CAP_RATE_PCT = 8.4

export const cobranzaAlDiaPct = () => {
  const enMora = contratos.filter((c) => c.estatus === 'En Mora').length
  return Math.round(((contratos.length - enMora) / contratos.length) * 1000) / 10
}

export const certificacionesLEEDCount = () => naves.filter((n) => n.certificacionLEED !== null).length
export const cumplimientoSTPSPromedio = () =>
  Math.round(naves.reduce((acc, n) => acc + n.cumplimientoSTPS, 0) / naves.length)

export interface SegmentoIndustria {
  industria: Industria
  inquilinos: number
  m2: number
  pct: number
}

export const desgloseIndustria = (): SegmentoIndustria[] => {
  const industrias: Industria[] = ['Manufactura Avanzada', 'Logística & E-commerce', 'Automotriz & Tier 1', 'Otros']
  const totalInquilinos = inquilinos.length

  return industrias.map((industria) => {
    const inquilinosDeSegmento = inquilinos.filter((i) => i.industria === industria)
    const naveIds = Object.entries(inquilinoPorNaveId)
      .filter(([, inqId]) => inqId && inquilinosDeSegmento.some((i) => i.id === inqId))
      .map(([naveId]) => naveId)
    const m2 = naves.filter((n) => naveIds.includes(n.id)).reduce((acc, n) => acc + n.gla, 0)
    return {
      industria,
      inquilinos: inquilinosDeSegmento.length,
      m2,
      pct: Math.round((inquilinosDeSegmento.length / totalInquilinos) * 1000) / 10,
    }
  })
}

export const totalInquilinosActivos = () => inquilinos.length

// Serie mensual de NOI — ejecutado (ene–sep 2026) + proyección (oct–dic 2026).
export interface PuntoNOI {
  mes: string
  ejecutadoUSD: number | null
  proyeccionUSD: number | null
}

export const serieNOIAnual = (): PuntoNOI[] => {
  const base = ingresoMensualTotalUSD()
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const mesActualIdx = 8 // Septiembre 2026 (0-indexado)

  return meses.map((mes, idx) => {
    const factorEstacional = 1 + Math.sin(idx / 2) * 0.015
    const crecimiento = 1 + idx * 0.004
    const valor = Math.round(base * factorEstacional * crecimiento)
    if (idx < mesActualIdx) return { mes, ejecutadoUSD: valor, proyeccionUSD: null }
    if (idx === mesActualIdx) return { mes, ejecutadoUSD: valor, proyeccionUSD: valor }
    return { mes, ejecutadoUSD: null, proyeccionUSD: valor }
  })
}
