import { naveById, parqueById, tareasVivas, type TareaViva } from '@/data'
import { cn } from '@/lib/utils'

const COLUMNAS: { key: TareaViva['columna']; titulo: string; tono: string }[] = [
  { key: 'urgente', titulo: 'Urgentes / Críticas', tono: 'border-l-status-danger' },
  { key: 'en-ejecucion', titulo: 'En Ejecución / En Curso', tono: 'border-l-brand-cobalt' },
  { key: 'completada', titulo: 'Completadas Recientes', tono: 'border-l-status-success' },
]

export function TareasVivasFlow() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {COLUMNAS.map((col) => {
        const tareas = tareasVivas.filter((t) => t.columna === col.key)
        return (
          <div key={col.key} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary/40 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">{col.titulo}</h4>
              <span className="tabular rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{tareas.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {tareas.map((t) => {
                const nave = naveById(t.naveId)
                const parque = nave ? parqueById(nave.parqueId) : undefined
                return (
                  <div key={t.id} className={cn('rounded-md border border-l-4 border-border bg-card p-3', col.tono)}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t.categoria}</span>
                    <p className="mt-1 text-sm leading-snug font-medium text-foreground">{t.titulo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {parque?.nombre} — Nave {nave?.numeroNave}
                    </p>
                    {typeof t.avancePct === 'number' && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                        <div className="h-full rounded-full bg-brand-cobalt" style={{ width: `${t.avancePct}%` }} />
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{t.responsable}</span>
                      {t.estatusCierre && (
                        <span className="rounded-full bg-status-success-bg px-2 py-0.5 font-semibold text-status-success">{t.estatusCierre}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
