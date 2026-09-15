import { naves } from './naves'
import { contratos } from './contratos'
import { inquilinos } from './inquilinos'
import type { ContratoArrendamiento, Inquilino, Industria, Nave } from './types'

export const totalNaves = (navesInput: Nave[] = naves) => navesInput.length
export const navesOcupadas = (navesInput: Nave[] = naves) => navesInput.filter((n) => n.ocupada).length
export const ocupacionGlobalPct = (navesInput: Nave[] = naves) =>
  Math.round((navesOcupadas(navesInput) / totalNaves(navesInput)) * 1000) / 10

export const glaTotal = (navesInput: Nave[] = naves) => navesInput.reduce((acc, n) => acc + n.gla, 0)
export const glaDisponible = (navesInput: Nave[] = naves) => navesInput.filter((n) => !n.ocupada).reduce((acc, n) => acc + n.gla, 0)

export const ingresoMensualTotalUSD = (contratosInput: ContratoArrendamiento[] = contratos) =>
  contratosInput.reduce((acc, c) => acc + c.rentaBaseMensual + c.cam, 0)

export const PRESUPUESTO_MENSUAL_USD = 1_905_000
export const CAP_RATE_PCT = 8.4

export const cobranzaAlDiaPct = (contratosInput: ContratoArrendamiento[] = contratos) => {
  const enMora = contratosInput.filter((c) => c.estatus === 'En Mora').length
  return Math.round(((contratosInput.length - enMora) / contratosInput.length) * 1000) / 10
}

export const certificacionesLEEDCount = (navesInput: Nave[] = naves) => navesInput.filter((n) => n.certificacionLEED !== null).length
export const cumplimientoSTPSPromedio = (navesInput: Nave[] = naves) =>
  Math.round(navesInput.reduce((acc, n) => acc + n.cumplimientoSTPS, 0) / navesInput.length)

export interface SegmentoIndustria {
  industria: Industria
  inquilinos: number
  m2: number
  pct: number
}

// La relación nave -> inquilino ya vive en contratos.inquilino_id (real desde Fase 6g);
// aquí solo se resuelve vía el contrato de cada nave, sin un mapa aparte que mantener.
export const desgloseIndustria = (
  navesInput: Nave[] = naves,
  inquilinosInput: Inquilino[] = inquilinos,
  contratosInput: ContratoArrendamiento[] = contratos,
): SegmentoIndustria[] => {
  const industrias: Industria[] = ['Manufactura Avanzada', 'Logística & E-commerce', 'Automotriz & Tier 1', 'Otros']
  const totalInquilinos = inquilinosInput.length
  const inquilinoIdPorNave = new Map(contratosInput.map((c) => [c.naveId, c.inquilinoId]))

  return industrias.map((industria) => {
    const inquilinosDeSegmento = inquilinosInput.filter((i) => i.industria === industria)
    const naveIds = navesInput
      .filter((n) => {
        const inqId = inquilinoIdPorNave.get(n.id)
        return inqId && inquilinosDeSegmento.some((i) => i.id === inqId)
      })
      .map((n) => n.id)
    const m2 = navesInput.filter((n) => naveIds.includes(n.id)).reduce((acc, n) => acc + n.gla, 0)
    return {
      industria,
      inquilinos: inquilinosDeSegmento.length,
      m2,
      pct: totalInquilinos === 0 ? 0 : Math.round((inquilinosDeSegmento.length / totalInquilinos) * 1000) / 10,
    }
  })
}

export const totalInquilinosActivos = (inquilinosInput: Inquilino[] = inquilinos) => inquilinosInput.length

// Serie mensual de NOI — ejecutado (ene–sep 2026) + proyección (oct–dic 2026).
export interface PuntoNOI {
  mes: string
  ejecutadoUSD: number | null
  proyeccionUSD: number | null
}

export const serieNOIAnual = (contratosInput: ContratoArrendamiento[] = contratos): PuntoNOI[] => {
  const base = ingresoMensualTotalUSD(contratosInput)
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
