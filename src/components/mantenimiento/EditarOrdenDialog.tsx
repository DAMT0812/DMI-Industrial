import { useEffect, useRef, useState } from 'react'
import { Download, FileUp, Pause, Play, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/context/DataStoreContext'
import { supabase } from '@/lib/supabaseClient'
import { type OrdenTrabajo, type PrioridadTicket } from '@/data'

const PRIORIDADES: PrioridadTicket[] = ['Crítica', 'Alta', 'Media', 'Baja']
const BUCKET = 'documentos'

interface FormState {
  categoria: string
  descripcion: string
  prioridad: PrioridadTicket
  contratistaId: string
  costoEstimado: string
}

function estadoDesdeOrden(o: OrdenTrabajo): FormState {
  return {
    categoria: o.categoria,
    descripcion: o.descripcion,
    prioridad: o.prioridad,
    contratistaId: o.contratistaId,
    costoEstimado: String(o.costoEstimado),
  }
}

export function EditarOrdenDialog({
  open,
  onOpenChange,
  orden,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orden: OrdenTrabajo
}) {
  const { editarOrden, pausaAbiertaPorOrden, pausarOrden, reanudarOrden, evidenciaPendientePorOrden, enviarEvidencia, contratistas, slaHoras } = useDataStore()
  const [form, setForm] = useState<FormState>(() => estadoDesdeOrden(orden))
  const [guardado, setGuardado] = useState(false)
  const [motivoPausa, setMotivoPausa] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false)
  const [urlEvidencia, setUrlEvidencia] = useState<string | null>(null)
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  const pausa = pausaAbiertaPorOrden(orden.id)
  const evidencia = evidenciaPendientePorOrden(orden.id)

  useEffect(() => {
    if (open) {
      setForm(estadoDesdeOrden(orden))
      setGuardado(false)
      setMotivoPausa('')
      setMotivoCancelacion('')
      setCancelando(false)
    }
  }, [open, orden])

  useEffect(() => {
    if (!open || !evidencia?.archivoPath) {
      setUrlEvidencia(null)
      return
    }
    let cancelado = false
    supabase
      .storage.from(BUCKET)
      .createSignedUrl(evidencia.archivoPath, 300)
      .then(({ data }) => {
        if (!cancelado && data) setUrlEvidencia(data.signedUrl)
      })
    return () => {
      cancelado = true
    }
  }, [open, evidencia?.archivoPath])

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function guardar() {
    editarOrden(orden.id, {
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      prioridad: form.prioridad,
      slaHoras: slaHoras[form.prioridad],
      contratistaId: form.contratistaId,
      costoEstimado: Number(form.costoEstimado),
    })
    setGuardado(true)
  }

  function subirEvidencia(archivo: File) {
    setSubiendoEvidencia(true)
    enviarEvidencia(orden.id, archivo)
    setSubiendoEvidencia(false)
  }

  const esTerminal = orden.estatus === 'Validado' || orden.estatus === 'Cancelada'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Orden de Trabajo — {orden.folio}</DialogTitle>
          <DialogDescription>
            Los cambios se reflejan de inmediato en el Tablero de Mantenimiento, Tareas Vivas y el Expediente 360° de la nave.
          </DialogDescription>
        </DialogHeader>

        {guardado ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Orden {orden.folio} actualizada correctamente.</p>
            <Button size="sm" variant="outline" onClick={() => setGuardado(false)}>
              Seguir editando
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Categoría / Sistema</Label>
              <Input value={form.categoria} onChange={(e) => set('categoria', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Descripción</Label>
              <Textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Prioridad (define SLA)</Label>
                <select
                  value={form.prioridad}
                  onChange={(e) => set('prioridad', e.target.value as PrioridadTicket)}
                  className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>
                      {p} — SLA {slaHoras[p]}h
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contratista Asignado</Label>
                <select
                  value={form.contratistaId}
                  onChange={(e) => set('contratistaId', e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                >
                  {contratistas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Costo Estimado (USD)</Label>
                <Input value={form.costoEstimado} onChange={(e) => set('costoEstimado', e.target.value)} inputMode="numeric" />
              </div>
            </div>

            <div className="mt-1 flex justify-end">
              <Button size="sm" onClick={guardar}>
                Guardar Cambios de Ficha
              </Button>
            </div>

            <div className="rounded-md border border-border bg-surface-secondary p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gestión de Estatus</span>
                <StatusBadge estatus={orden.estatus} />
              </div>

              {orden.estatus === 'Abierta' && (
                <Button size="sm" className="gap-1.5" onClick={() => editarOrden(orden.id, { estatus: 'En ejecución' })}>
                  <Play className="h-3.5 w-3.5" />
                  Iniciar Ejecución
                </Button>
              )}

              {orden.estatus === 'En ejecución' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Pausar por falta de refacción</Label>
                    <Textarea
                      value={motivoPausa}
                      onChange={(e) => setMotivoPausa(e.target.value)}
                      placeholder="Ej. Refacción en tránsito, llega en 5 días hábiles"
                      rows={2}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-fit gap-1.5"
                      disabled={motivoPausa.trim().length === 0}
                      onClick={() => {
                        pausarOrden(orden.id, motivoPausa.trim())
                        setMotivoPausa('')
                      }}
                    >
                      <Pause className="h-3.5 w-3.5" />
                      Pausar Orden
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                    <Label className="text-[11px] font-medium text-muted-foreground">Enviar a validación (requiere evidencia)</Label>
                    <input
                      ref={inputArchivoRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0]
                        if (archivo) subirEvidencia(archivo)
                        e.target.value = ''
                      }}
                    />
                    <Button
                      size="sm"
                      className="w-fit gap-1.5"
                      disabled={subiendoEvidencia}
                      onClick={() => inputArchivoRef.current?.click()}
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      {subiendoEvidencia ? 'Subiendo…' : 'Subir Evidencia y Enviar a Validación'}
                    </Button>
                  </div>
                </div>
              )}

              {orden.estatus === 'Esperando Refacción' && (
                <div className="flex flex-col gap-2">
                  {pausa?.motivo && <p className="text-xs text-muted-foreground">Motivo de la pausa: {pausa.motivo}</p>}
                  <Button size="sm" className="w-fit gap-1.5" onClick={() => reanudarOrden(orden.id)}>
                    <Play className="h-3.5 w-3.5" />
                    Reanudar Ejecución
                  </Button>
                </div>
              )}

              {orden.estatus === 'Pendiente de Evidencia' && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">Esperando validación de Facility Manager en el tablero de mantenimiento.</p>
                  {urlEvidencia && (
                    <Button size="sm" variant="outline" className="w-fit gap-1.5" onClick={() => window.open(urlEvidencia, '_blank')}>
                      <Download className="h-3.5 w-3.5" />
                      Ver Evidencia de Cierre
                    </Button>
                  )}
                </div>
              )}

              {orden.estatus === 'Cancelada' && orden.motivoCancelacion && (
                <p className="text-xs text-muted-foreground">Motivo de cancelación: {orden.motivoCancelacion}</p>
              )}

              {!esTerminal && (
                <div className="mt-3 border-t border-border pt-3">
                  {cancelando ? (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-medium text-muted-foreground">Motivo de cancelación (obligatorio)</Label>
                      <Textarea
                        value={motivoCancelacion}
                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                        placeholder="Ej. Reporte duplicado, alcance ya cubierto por otra orden"
                        rows={2}
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setCancelando(false)}>
                          Volver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={motivoCancelacion.trim().length === 0}
                          onClick={() => editarOrden(orden.id, { estatus: 'Cancelada', motivoCancelacion: motivoCancelacion.trim() })}
                        >
                          Confirmar Cancelación
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 text-status-danger hover:text-status-danger" onClick={() => setCancelando(true)}>
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar Orden
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
