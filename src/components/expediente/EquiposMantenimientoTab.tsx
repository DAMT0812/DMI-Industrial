import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { sistemasPorNave, type Nave } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { formatMoneda } from '@/lib/format'
import { formatFecha } from '@/lib/dates'

export function EquiposMantenimientoTab({ nave }: { nave: Nave }) {
  const { moneda } = usePreferences()
  const { ordenesPorNave } = useDataStore()
  const sistemas = sistemasPorNave(nave.id)
  const ordenes = ordenesPorNave(nave.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Inventario de Sistemas Críticos</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sistemas.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground">{s.tipo}</div>
                  <StatusBadge estatus={s.estatusSalud} />
                </div>
                <div className="text-[11px] text-muted-foreground">{s.codigoReferencia}</div>
                <div className="text-xs font-medium text-foreground">{s.indicadorSalud}</div>
                <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                  <span>Vendor: {s.vendor}</span>
                  <span>Frecuencia: {s.frecuenciaMantenimiento}</span>
                  <span className="tabular">Costo anual estimado: {formatMoneda(s.costoAnualEstimado, moneda)}</span>
                  <span className="tabular">Último: {formatFecha(s.fechaUltimoMantenimiento)}</span>
                  <span className="tabular">Próximo: {formatFecha(s.fechaProximoMantenimiento)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {ordenes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Bitácora de Órdenes de Trabajo de esta Nave</h3>
          <div className="flex flex-col gap-2">
            {ordenes.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-3 text-sm">
                <div>
                  <span className="font-medium text-foreground">{o.folio}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{o.categoria} · {o.descripcion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge estatus={o.prioridad} />
                  <StatusBadge estatus={o.estatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
