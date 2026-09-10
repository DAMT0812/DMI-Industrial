import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { parqueById, type ColumnaKanban, type TareaOperativa } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { formatMoneda } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EditarTareaDialog } from '@/components/tareas/EditarTareaDialog'

const COLUMNAS: ColumnaKanban[] = ['Por Iniciar', 'En Cotización', 'En Ejecución', 'Completado & Auditado']

const CATEGORIA_TONO: Record<string, string> = {
  'Regulatorio Legal': 'bg-status-danger-bg text-status-danger',
  'CapEx Prioritario': 'bg-badge-capex-bg text-badge-capex-text',
  'Correctivo Inmediato': 'bg-status-warning-bg text-status-warning',
  Preventivo: 'bg-badge-mant-bg text-badge-mant-text',
  'Mantenimiento Mayor': 'bg-badge-mant-bg text-badge-mant-text',
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

function TareaCard({ tarea, onEditar }: { tarea: TareaOperativa; onEditar: (tarea: TareaOperativa) => void }) {
  const { moneda } = usePreferences()
  const { naveById } = useDataStore()
  const nave = naveById(tarea.naveId)
  const parque = nave ? parqueById(nave.parqueId) : undefined

  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-semibold', CATEGORIA_TONO[tarea.categoria] ?? 'bg-muted text-muted-foreground')}>
          {tarea.categoria}
        </span>
        <Button size="icon-sm" variant="ghost" className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="Editar tarea" onClick={() => onEditar(tarea)}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
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
  const { perfilSimulado } = usePreferences()
  const { tareasOperativas, naveById } = useDataStore()
  const [tareaParaEditar, setTareaParaEditar] = useState<TareaOperativa | null>(null)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {COLUMNAS.map((col) => {
        const tareas = tareasOperativas
          .filter((t) => t.columna === col)
          .filter((t) => perfilSimulado.region === 'todas' || parqueById(naveById(t.naveId)!.parqueId)?.region === perfilSimulado.region)
        return (
          <div key={col} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary/40 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">{col}</h4>
              <span className="tabular rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{tareas.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {tareas.map((t) => (
                <TareaCard key={t.id} tarea={t} onEditar={setTareaParaEditar} />
              ))}
            </div>
          </div>
        )
      })}

      {tareaParaEditar && (
        <EditarTareaDialog open={tareaParaEditar !== null} onOpenChange={(open) => !open && setTareaParaEditar(null)} tarea={tareaParaEditar} />
      )}
    </div>
  )
}
