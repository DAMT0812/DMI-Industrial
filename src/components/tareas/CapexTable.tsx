import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EditarCapexDialog } from '@/components/tareas/EditarCapexDialog'
import { parqueById, type SentidoVoto } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { useAuth } from '@/context/AuthContext'
import { puedeEditarCapex, puedeResolverCapex, puedeVotarCapex } from '@/lib/permissions'
import { formatMoneda, formatSuperficie } from '@/lib/format'

const SENTIDOS: SentidoVoto[] = ['A favor', 'En contra', 'Abstención']

export function CapexTable() {
  const { moneda, unidad } = usePreferences()
  const { perfilActivo } = useAuth()
  const {
    proyectosCapex,
    naveById,
    cotizacionesPorProyecto,
    votosPorProyecto,
    miVotoPorProyecto,
    votarCapex,
    resolverComiteCapex,
    perfilesPorId,
  } = useDataStore()
  // Se guarda el id, no el objeto, para que el modal siempre lea el proyecto vivo del
  // contexto (votos/estatus/cotizaciones cambian mientras el modal sigue abierto).
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [proyectoParaEditarId, setProyectoParaEditarId] = useState<string | null>(null)
  const [sentidoVoto, setSentidoVoto] = useState<SentidoVoto>('A favor')
  const [comentarioVoto, setComentarioVoto] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const seleccionado = proyectosCapex.find((p) => p.id === seleccionadoId) ?? null
  const proyectoParaEditar = proyectosCapex.find((p) => p.id === proyectoParaEditarId) ?? null
  const nave = seleccionado ? naveById(seleccionado.naveId) : null
  const parque = nave ? parqueById(nave.parqueId) : null
  const cotizaciones = seleccionado ? cotizacionesPorProyecto(seleccionado.id).filter((c) => c.recibida) : []
  const votos = seleccionado ? votosPorProyecto(seleccionado.id) : []
  const miVoto = seleccionado ? miVotoPorProyecto(seleccionado.id) : undefined

  function alAbrir(abierto: boolean) {
    if (!abierto) {
      setSeleccionadoId(null)
      setRechazando(false)
      setMotivoRechazo('')
      setComentarioVoto('')
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código / Proyecto</TableHead>
              <TableHead>Ubicación & Superficie</TableHead>
              <TableHead className="text-right">Inversión Estimada</TableHead>
              <TableHead>ROI Proyectado</TableHead>
              <TableHead>Estatus del Comité DMI</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proyectosCapex.map((p) => {
              // naves y proyectosCapex se cargan con fetches independientes: en un refresh
              // en frío pueden resolver en cualquier orden, así que no se asume que la nave
              // ya esté disponible en este render.
              const n = naveById(p.naveId)
              if (!n) return null
              const pq = parqueById(n.parqueId)!
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{p.codigo}</div>
                    <div className="max-w-[220px] truncate text-xs text-muted-foreground">{p.titulo}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {pq.nombre} — Nave {n.numeroNave}
                    <div className="tabular">{formatSuperficie(n.gla, unidad)}</div>
                  </TableCell>
                  <TableCell className="tabular text-right">{formatMoneda(p.inversionEstimada, moneda)}</TableCell>
                  <TableCell className="tabular text-xs">
                    {p.roiProyectadoPct}% · {p.paybackAnios} años payback
                  </TableCell>
                  <TableCell>
                    <StatusBadge estatus={p.estatusComite} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {puedeEditarCapex(perfilActivo.rol) && (
                        <Button size="icon-sm" variant="outline" className="h-7 w-7" aria-label="Editar proyecto CapEx" onClick={() => setProyectoParaEditarId(p.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSeleccionadoId(p.id)}>
                        Ver Ficha
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={seleccionado !== null} onOpenChange={alAbrir}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {seleccionado && (
            <>
              <DialogHeader>
                <DialogTitle>{seleccionado.codigo}</DialogTitle>
                <DialogDescription>
                  {parque?.nombre} — Nave {nave?.numeroNave}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <p className="font-medium text-foreground">{seleccionado.titulo}</p>
                <p className="text-muted-foreground">{seleccionado.justificacionTecnica}</p>
                <div className="grid grid-cols-2 gap-3 rounded-md bg-surface-secondary p-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase">Inversión Estimada</div>
                    <div className="tabular font-semibold text-primary">{formatMoneda(seleccionado.inversionEstimada, moneda)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase">ROI / Payback</div>
                    <div className="tabular font-semibold text-primary">
                      {seleccionado.roiProyectadoPct}% · {seleccionado.paybackAnios} años
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Cotizaciones Recibidas (RFP)</div>
                  <div className="flex flex-col gap-1.5">
                    {cotizaciones.length === 0 && <p className="text-xs text-muted-foreground">Aún no se registran cotizaciones.</p>}
                    {cotizaciones.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-sm border border-border px-2.5 py-1.5 text-xs">
                        <span className={c.proveedor === seleccionado.proveedorSeleccionado ? 'font-semibold text-status-success' : 'text-foreground'}>
                          {c.proveedor}
                        </span>
                        <span className="tabular text-muted-foreground">
                          {formatMoneda(c.monto, moneda)} · {c.garantiaMeses}m garantía
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {seleccionado.estatusComite === 'Rechazado' && seleccionado.motivoRechazo && (
                  <p className="rounded-sm bg-status-danger-bg px-2.5 py-1.5 text-xs text-status-danger">
                    Motivo de rechazo: {seleccionado.motivoRechazo}
                  </p>
                )}

                {(votos.length > 0 || seleccionado.estatusComite === 'En Revisión Comité') && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Votos del Comité de Dirección</div>
                    <div className="flex flex-col gap-1.5">
                      {votos.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay votos registrados.</p>}
                      {votos.map((v) => (
                        <div key={v.id} className="rounded-sm border border-border px-2.5 py-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{v.usuarioId ? (perfilesPorId[v.usuarioId] ?? 'Miembro del comité') : 'Miembro del comité'}</span>
                            <span
                              className={
                                v.sentido === 'A favor' ? 'font-semibold text-status-success' : v.sentido === 'En contra' ? 'font-semibold text-status-danger' : 'text-muted-foreground'
                              }
                            >
                              {v.sentido}
                            </span>
                          </div>
                          {v.comentario && <p className="mt-0.5 text-muted-foreground">{v.comentario}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seleccionado.estatusComite === 'En Revisión Comité' && puedeVotarCapex(perfilActivo.rol) && (
                  <div className="flex flex-col gap-1.5 rounded-md border border-border bg-surface-secondary p-3">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                      {miVoto ? 'Actualizar tu voto' : 'Registrar tu voto'}
                    </div>
                    <select
                      value={sentidoVoto}
                      onChange={(e) => setSentidoVoto(e.target.value as SentidoVoto)}
                      className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                    >
                      {SENTIDOS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Textarea
                      value={comentarioVoto}
                      onChange={(e) => setComentarioVoto(e.target.value)}
                      placeholder="Comentario opcional"
                      rows={2}
                    />
                    <Button size="sm" className="w-fit" onClick={() => votarCapex(seleccionado.id, sentidoVoto, comentarioVoto.trim() || undefined)}>
                      {miVoto ? 'Actualizar Voto' : 'Registrar Voto'}
                    </Button>
                  </div>
                )}

                {seleccionado.estatusComite === 'En Revisión Comité' && puedeResolverCapex(perfilActivo.rol) && (
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">Resolución del Comité</div>
                    {rechazando ? (
                      <div className="flex flex-col gap-1.5">
                        <Textarea
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Motivo del rechazo (obligatorio)"
                          rows={2}
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setRechazando(false)}>
                            Volver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={motivoRechazo.trim().length === 0}
                            onClick={() => resolverComiteCapex(seleccionado.id, 'rechazar', motivoRechazo.trim())}
                          >
                            Confirmar Rechazo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => resolverComiteCapex(seleccionado.id, 'aprobar')}>
                          Aprobar Proyecto
                        </Button>
                        <Button size="sm" variant="outline" className="text-status-danger hover:text-status-danger" onClick={() => setRechazando(true)}>
                          Rechazar Proyecto
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSeleccionadoId(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {proyectoParaEditar && (
        <EditarCapexDialog open={proyectoParaEditar !== null} onOpenChange={(open) => !open && setProyectoParaEditarId(null)} proyecto={proyectoParaEditar} />
      )}
    </>
  )
}
