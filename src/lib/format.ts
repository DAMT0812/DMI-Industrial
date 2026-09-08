export type Moneda = 'USD' | 'MXN'
export type UnidadSuperficie = 'm2' | 'sqft'

// Tipo de cambio de referencia del portafolio (USD → MXN).
export const TIPO_CAMBIO_MXN = 18.42

const M2_A_SQFT = 10.7639

export function convertirMoneda(montoUSD: number, destino: Moneda): number {
  return destino === 'MXN' ? montoUSD * TIPO_CAMBIO_MXN : montoUSD
}

export function formatMoneda(montoUSD: number, moneda: Moneda, opts?: { decimales?: number }): string {
  const valor = convertirMoneda(montoUSD, moneda)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: opts?.decimales ?? 0,
    maximumFractionDigits: opts?.decimales ?? 0,
  }).format(valor)
}

export function formatValorCompacto(valor: number, moneda: Moneda): string {
  const abs = Math.abs(valor)
  const simbolo = moneda === 'USD' ? 'US$' : 'MX$'
  if (abs >= 1_000_000) return `${simbolo} ${(valor / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${simbolo} ${(valor / 1_000).toFixed(0)}K`
  return `${simbolo} ${valor.toFixed(0)}`
}

export function formatMonedaCompacta(montoUSD: number, moneda: Moneda): string {
  return formatValorCompacto(convertirMoneda(montoUSD, moneda), moneda)
}

export function formatSuperficie(m2: number, unidad: UnidadSuperficie): string {
  const valor = unidad === 'sqft' ? m2 * M2_A_SQFT : m2
  return `${new Intl.NumberFormat('es-MX').format(Math.round(valor))} ${unidad === 'sqft' ? 'sq ft' : 'm²'}`
}

export function formatNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX').format(valor)
}

export function formatPct(valor: number, decimales = 0): string {
  return `${valor.toFixed(decimales)}%`
}
