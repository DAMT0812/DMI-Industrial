// Fecha de referencia fija del portafolio — todas las alertas y "días para vencer"
// se calculan contra esta fecha (no Date.now()) para que el dashboard sea determinista.
export const HOY = new Date('2026-09-08T00:00:00')

export function addDays(iso: string, dias: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function diasEntre(desde: Date, hastaIso: string): number {
  const hasta = new Date(hastaIso)
  return Math.round((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24))
}

export function diasParaVencer(fechaIso: string | null): number | null {
  if (!fechaIso) return null
  return diasEntre(HOY, fechaIso)
}

export function mesesRestantes(fechaIso: string): number {
  const dias = diasEntre(HOY, fechaIso)
  return Math.round(dias / 30.44)
}

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

export function formatFecha(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatFechaCorta(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
