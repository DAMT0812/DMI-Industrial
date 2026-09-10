import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { totalInquilinosActivos } from '@/data'
import { useDataStore } from '@/context/DataStoreContext'
import { formatSuperficie, type UnidadSuperficie } from '@/lib/format'

const COLORES = ['var(--color-brand-primary)', 'var(--color-brand-cobalt)', 'var(--color-brand-pine)', 'var(--color-brand-gray)']

export function IndustriaDonutChart({ unidad }: { unidad: UnidadSuperficie }) {
  const { desgloseIndustria: data } = useDataStore()
  const total = totalInquilinosActivos()

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[220px] w-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="inquilinos" nameKey="industria" innerRadius={62} outerRadius={92} paddingAngle={2} strokeWidth={0}>
              {data.map((d, i) => (
                <Cell key={d.industria} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12 }}
              formatter={(value, _name, entry) => [`${value} inquilinos · ${formatSuperficie(entry.payload.m2, unidad)}`, entry.payload.industria]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-bold text-primary">{total}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Inquilinos</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        {data.map((d, i) => (
          <div key={d.industria} className="flex items-start gap-2 text-sm">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
            <div className="min-w-0">
              <div className="leading-snug text-foreground">{d.industria}</div>
              <div className="tabular text-xs text-muted-foreground">
                {d.pct}% · {formatSuperficie(d.m2, unidad)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
