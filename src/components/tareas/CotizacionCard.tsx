import { Button } from '@/components/ui/button'
import { parqueById, type SolicitudCotizacion } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { formatMoneda } from '@/lib/format'
import { cn } from '@/lib/utils'

export function CotizacionCard({ solicitud }: { solicitud: SolicitudCotizacion }) {
  const { moneda } = usePreferences()
  const { naveById } = useDataStore()
  const nave = naveById(solicitud.naveId)
  const parque = nave ? parqueById(nave.parqueId) : undefined
  const listo = solicitud.recibidas === solicitud.total

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-brand-cobalt">{solicitud.folio}</div>
          <p className="mt-0.5 text-sm font-medium text-foreground">{solicitud.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {parque?.nombre} — Nave {nave?.numeroNave}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
            listo ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning',
          )}
        >
          {solicitud.recibidas}/{solicitud.total} recibidas{listo ? ' · Listo' : solicitud.diasParaVencer !== null ? ` · Vence en ${solicitud.diasParaVencer} días` : ''}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {solicitud.propuestas.map((p) => (
          <div
            key={p.proveedor}
            className={cn(
              'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs',
              p.mejorOferta ? 'bg-status-success-bg' : 'bg-surface-secondary',
            )}
          >
            <span className={cn(p.mejorOferta ? 'font-semibold text-status-success' : 'text-foreground')}>
              {p.recibida ? p.proveedor : `${p.proveedor} — sin recibir`}
            </span>
            {p.recibida && (
              <span className="tabular text-muted-foreground">
                {formatMoneda(p.precio, moneda)} · {p.garantiaMeses}m
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" className="h-7 text-xs" variant={listo ? 'default' : 'outline'}>
          {listo ? 'Comparar & Autorizar' : 'Requerir Entrega'}
        </Button>
      </div>
    </div>
  )
}
