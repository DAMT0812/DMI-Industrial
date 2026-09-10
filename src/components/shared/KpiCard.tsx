import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  etiqueta: string
  icono: LucideIcon
  valor: string
  detalle?: string
  progreso?: number // 0-100, dibuja una barra delgada bajo el detalle
  tendencia?: { valor: string; positiva: boolean }
  className?: string
}

export function KpiCard({ etiqueta, icono: Icono, valor, detalle, progreso, tendencia, className }: KpiCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="text-label-md flex items-center gap-1.5 uppercase text-muted-foreground">
        <Icono className="h-3.5 w-3.5" />
        {etiqueta}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="tabular text-headline-md font-bold text-primary">{valor}</span>
        {tendencia && (
          <span className={cn('text-body-sm tabular shrink-0 font-semibold', tendencia.positiva ? 'text-status-success' : 'text-status-danger')}>
            {tendencia.positiva ? '▲' : '▼'} {tendencia.valor}
          </span>
        )}
      </div>
      {detalle && <div className="text-metric-dual-secondary tabular mt-1 text-muted-foreground">{detalle}</div>}
      {typeof progreso === 'number' && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
          <div className="h-full rounded-full bg-brand-cobalt" style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }} />
        </div>
      )}
    </div>
  )
}
