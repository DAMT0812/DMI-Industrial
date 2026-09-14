import { Bell } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/context/DataStoreContext'
import { parqueById, type ContratoArrendamiento, type DocumentoPermiso, type Nave, type Notificacion } from '@/data'
import { cn } from '@/lib/utils'

// entidadRelacionada guarda `{entidadTipo}:{entidadId}:{umbral}` (ver DataStoreContext) —
// aquí se resuelve de vuelta a un texto legible usando los documentos/contratos ya
// cargados, igual que BitacoraPage resuelve su columna "Contexto".
function describirNotificacion(
  n: Notificacion,
  documentos: DocumentoPermiso[],
  contratos: ContratoArrendamiento[],
  naveById: (id: string) => Nave | undefined,
): { titulo: string; ubicacion: string } | null {
  if (!n.entidadRelacionada) return null
  const [entidadTipo, entidadId, umbral] = n.entidadRelacionada.split(':')

  if (entidadTipo === 'documento') {
    const doc = documentos.find((d) => d.id === entidadId)
    if (!doc) return null
    const nave = naveById(doc.naveId)
    const parque = nave ? parqueById(nave.parqueId) : undefined
    return {
      titulo: `${doc.tipo} · Folio ${doc.numeroFolio}`,
      ubicacion: nave && parque ? `${parque.nombre} — Nave ${nave.numeroNave} · vence en ≤${umbral} días` : `Vence en ≤${umbral} días`,
    }
  }

  if (entidadTipo === 'contrato') {
    const contrato = contratos.find((c) => c.id === entidadId)
    if (!contrato) return null
    const nave = naveById(contrato.naveId)
    const parque = nave ? parqueById(nave.parqueId) : undefined
    return {
      titulo: `Vencimiento de contrato de arrendamiento (${contrato.tipoContrato})`,
      ubicacion: nave && parque ? `${parque.nombre} — Nave ${nave.numeroNave} · vence en ≤${umbral} días` : `Vence en ≤${umbral} días`,
    }
  }

  return null
}

export function NotificacionesMenu() {
  const { misNotificaciones, notificacionesNoLeidas, marcarNotificacionLeida, marcarTodasNotificacionesLeidas, documentos, contratos, naveById } =
    useDataStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {notificacionesNoLeidas > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-status-danger ring-2 ring-card" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-xs font-medium text-muted-foreground">Notificaciones</span>
          {notificacionesNoLeidas > 0 && (
            <button type="button" className="text-[11px] font-medium text-brand-cobalt hover:underline" onClick={marcarTodasNotificacionesLeidas}>
              Marcar todas como leídas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {misNotificaciones.length === 0 && <p className="px-1.5 py-3 text-center text-xs text-muted-foreground">Sin notificaciones.</p>}
        {misNotificaciones.slice(0, 15).map((n) => {
          const info = describirNotificacion(n, documentos, contratos, naveById)
          return (
            <DropdownMenuItem
              key={n.id}
              className={cn('flex-col items-start gap-1 whitespace-normal py-2', !n.leida && 'bg-brand-cobalt/5')}
              onClick={() => !n.leida && marcarNotificacionLeida(n.id)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <StatusBadge estatus={n.urgencia ?? 'Programado'} />
                {!n.leida && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cobalt" />}
              </div>
              {info ? (
                <>
                  <p className="text-xs font-medium text-foreground">{info.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">{info.ubicacion}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{n.tipo}</p>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
