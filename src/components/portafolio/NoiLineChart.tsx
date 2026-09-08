import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { serieNOIAnual } from '@/data'
import { convertirMoneda, formatValorCompacto, type Moneda } from '@/lib/format'

export function NoiLineChart({ moneda }: { moneda: Moneda }) {
  const serie = serieNOIAnual().map((p) => ({
    mes: p.mes,
    ejecutado: p.ejecutadoUSD !== null ? convertirMoneda(p.ejecutadoUSD, moneda) : null,
    proyeccion: p.proyeccionUSD !== null ? convertirMoneda(p.proyeccionUSD, moneda) : null,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => formatValorCompacto(v, moneda)}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
          formatter={(value) => [new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(Number(value)), '']}
        />
        <Line type="monotone" dataKey="ejecutado" name="Ejecutado" stroke="var(--color-brand-primary)" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="proyeccion" name="Proyección" stroke="var(--color-brand-cobalt)" strokeWidth={2.5} strokeDasharray="5 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
