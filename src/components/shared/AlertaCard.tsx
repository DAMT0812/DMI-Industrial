import { AlertTriangle, ShieldAlert, Info } from 'lucide-react'
import type { AlertaVencimiento } from '@/data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ESTILO_URGENCIA: Record<AlertaVencimiento['urgencia'], { borde: string; icono: typeof AlertTriangle; iconoColor: string }> = {
  'Crítico Inminente': { borde: 'border-l-status-danger', icono: ShieldAlert, iconoColor: 'text-status-danger' },
  'Garantía Legal': { borde: 'border-l-status-warning', icono: AlertTriangle, iconoColor: 'text-status-warning' },
  'En Cumplimiento': { borde: 'border-l-status-success', icono: Info, iconoColor: 'text-status-success' },
}

export function AlertaCard({ alerta }: { alerta: AlertaVencimiento }) {
  const estilo = ESTILO_URGENCIA[alerta.urgencia]
  const Icono = estilo.icono
  const vencimientoTexto = alerta.diasParaVencer < 0
    ? `Vencido hace ${Math.abs(alerta.diasParaVencer)} días`
    : alerta.diasParaVencer === 0
      ? 'Vence hoy'
      : `Vence en ${alerta.diasParaVencer} días`

  return (
    <div className={cn('flex min-w-[280px] flex-1 flex-col gap-2 rounded-lg border border-l-4 border-border bg-card p-3.5', estilo.borde)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Icono className={cn('h-3.5 w-3.5', estilo.iconoColor)} />
          {alerta.tipo}
        </div>
        <span className="tabular shrink-0 text-[11px] font-semibold text-foreground">{vencimientoTexto}</span>
      </div>
      <p className="text-sm leading-snug text-foreground">{alerta.descripcion}</p>
      {alerta.montoOSuperficie && <p className="tabular text-xs text-muted-foreground">{alerta.montoOSuperficie}</p>}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">{alerta.responsable.split(' — ')[0]}</span>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          {alerta.accion}
        </Button>
      </div>
    </div>
  )
}
