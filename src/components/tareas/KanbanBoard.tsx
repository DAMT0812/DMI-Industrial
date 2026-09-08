import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { naveById, parqueById, tareasOperativas, type ColumnaKanban, type TareaOperativa } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { formatMoneda } from '@/lib/format'
import { cn } from '@/lib/utils'

const COLUMNAS: ColumnaKanban[] = ['Por Iniciar', 'En Cotización', 'En Ejecución', 'Completado & Auditado']

const CATEGORIA_TONO: Record<string, string> = {
  'Regulatorio Legal': 'bg-status-danger-bg text-status-danger',
  'CapEx Prioritario': 'bg-brand-cobalt/10 text-brand-cobalt',
  'Correctivo Inmediato': 'bg-status-warning-bg text-status-warning',
  Preventivo: 'bg-status-success-bg text-status-success',
  'Mantenimiento Mayor': 'bg-brand-pine/10 text-brand-pine',
  'Cobranza CAM': 'bg-status-neutral-bg text-status-neutral',
  'Sanidad Operativa': 'bg-status-neutral-bg text-status-neutral',
}

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter((w) => /^[A-ZÁÉÍÓÚ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

function TareaCard({ tarea }: { tarea: TareaOperativa }) {
  const { moneda } = usePreferences()
  const nave = naveById(tarea.naveId)
  const parque = nave ? parqueById(nave.parqueId) : undefined

  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
      <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-semibold', CATEGORIA_TONO[tarea.categoria] ?? 'bg-muted text-muted-foreground')}>
        {tarea.categoria}
      </span>
      <p className="mt-2 text-sm leading-snug font-medium text-foreground">{tarea.titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {parque?.nombre} — Nave {nave?.numeroNave}
      </p>

      {typeof tarea.avancePct === 'number' && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
          <div className="h-full rounded-full bg-brand-cobalt" style={{ width: `${tarea.avancePct}%` }} />
        </div>
      )}
      {tarea.cotizacionesRecibidas && <p className="tabular mt-2 text-xs text-muted-foreground">{tarea.cotizacionesRecibidas}</p>}
      {typeof tarea.slaRestanteHoras === 'number' && (
        <p className="tabular mt-1 text-xs font-semibold text-status-danger">SLA restante: {tarea.slaRestanteHoras}h</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">{iniciales(tarea.responsable)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-[11px] text-muted-foreground">{tarea.responsable.split(' — ')[0]}</span>
        </div>
        {tarea.costoEstimado !== null && <span className="tabular text-xs font-semibold text-foreground">{formatMoneda(tarea.costoEstimado, moneda)}</span>}
      </div>
    </div>
  )
}

export function KanbanBoard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {COLUMNAS.map((col) => {
        const tareas = tareasOperativas.filter((t) => t.columna === col)
        return (
          <div key={col} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary/40 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">{col}</h4>
              <span className="tabular rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{tareas.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {tareas.map((t) => (
                <TareaCard key={t.id} tarea={t} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
