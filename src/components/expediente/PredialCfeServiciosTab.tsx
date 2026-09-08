import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { documentosPorNave, type TipoDocumento, type Nave } from '@/data'
import { formatFecha, diasParaVencer } from '@/lib/dates'
import { FileCheck2 } from 'lucide-react'

const TIPOS_SERVICIOS: TipoDocumento[] = ['Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal']

export function PredialCfeServiciosTab({ nave }: { nave: Nave }) {
  const documentos = documentosPorNave(nave.id).filter((d) => TIPOS_SERVICIOS.includes(d.tipo))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {documentos.map((d) => {
        const dias = diasParaVencer(d.fechaVencimiento)
        const proximoAVencer = dias !== null && dias <= 60

        return (
          <div key={d.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 shrink-0 text-brand-cobalt" />
                <span className="text-sm font-semibold text-foreground">{d.tipo}</span>
              </div>
              <StatusBadge estatus={d.estatusJuridico} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{d.dependenciaEmisora}</p>
            <p className="tabular mt-1 text-xs text-muted-foreground">Folio {d.numeroFolio}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="tabular text-muted-foreground">Comprobante: {formatFecha(d.fechaEmision)}</span>
              {d.fechaVencimiento && (
                <span className={`tabular font-semibold ${proximoAVencer ? 'text-status-danger' : 'text-muted-foreground'}`}>
                  Vence: {formatFecha(d.fechaVencimiento)}
                </span>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" className="h-7 text-xs">
                Ver Comprobante PDF
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
