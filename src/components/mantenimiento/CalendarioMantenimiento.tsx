import { eventosCalendario, parqueById } from '@/data'
import { useDataStore } from '@/context/DataStoreContext'
import { cn } from '@/lib/utils'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const COLOR_TIPO: Record<string, string> = {
  'Mantenimiento Preventivo': 'bg-status-success-bg text-status-success',
  'Paro Técnico': 'bg-status-danger-bg text-status-danger',
  Auditoría: 'bg-brand-cobalt/10 text-brand-cobalt',
  Inspección: 'bg-status-warning-bg text-status-warning',
  Sanidad: 'bg-status-neutral-bg text-status-neutral',
}

export function CalendarioMantenimiento() {
  const { naveById } = useDataStore()
  const dias = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <div className="grid grid-cols-7 gap-2">
      {DIAS_SEMANA.map((d) => (
        <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {d}
        </div>
      ))}
      {dias.map((dia) => {
        const eventos = eventosCalendario.filter((e) => e.dia === dia)
        return (
          <div key={dia} className="min-h-[86px] rounded-md border border-border bg-surface-secondary/40 p-1.5">
            <div className="tabular text-[11px] font-semibold text-muted-foreground">{dia}</div>
            <div className="mt-1 flex flex-col gap-1">
              {eventos.map((e) => {
                const nave = naveById(e.naveId)
                const parque = nave ? parqueById(nave.parqueId) : undefined
                return (
                  <div
                    key={e.id}
                    title={`${e.hora} · ${e.descripcion} — ${parque?.nombre ?? ''} Nave ${nave?.numeroNave ?? ''} · ${e.responsable}`}
                    className={cn('truncate rounded-sm px-1 py-0.5 text-[10px] font-medium', COLOR_TIPO[e.tipo] ?? 'bg-muted text-muted-foreground')}
                  >
                    {e.hora} · {e.tipo}
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
