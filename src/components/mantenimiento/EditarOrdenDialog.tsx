import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'
import { contratistas, SLA_HORAS, type OrdenTrabajo, type PrioridadTicket, type EstatusTicket } from '@/data'

const PRIORIDADES: PrioridadTicket[] = ['Crítica', 'Alta', 'Media', 'Baja']
const ESTATUS_TICKET: EstatusTicket[] = ['Abierta', 'En ejecución', 'Esperando Refacción', 'Pendiente de Evidencia', 'Validado', 'Cancelada']

interface FormState {
  categoria: string
  descripcion: string
  prioridad: PrioridadTicket
  contratistaId: string
  costoEstimado: string
  estatus: EstatusTicket
}

function estadoDesdeOrden(o: OrdenTrabajo): FormState {
  return {
    categoria: o.categoria,
    descripcion: o.descripcion,
    prioridad: o.prioridad,
    contratistaId: o.contratistaId,
    costoEstimado: String(o.costoEstimado),
    estatus: o.estatus,
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
  const { editarOrden } = useDataStore()
  const [form, setForm] = useState<FormState>(() => estadoDesdeOrden(orden))
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(estadoDesdeOrden(orden))
      setGuardado(false)
    }
  }, [open, orden])

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function guardar() {
    editarOrden(orden.id, {
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      prioridad: form.prioridad,
      slaHoras: SLA_HORAS[form.prioridad],
      contratistaId: form.contratistaId,
      costoEstimado: Number(form.costoEstimado),
      estatus: form.estatus,
    })
    setGuardado(true)
  }

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
                      {p} — SLA {SLA_HORAS[p]}h
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estatus</Label>
                <select
                  value={form.estatus}
                  onChange={(e) => set('estatus', e.target.value as EstatusTicket)}
                  className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                >
                  {ESTATUS_TICKET.map((s) => (
                    <option key={s} value={s}>
                      {s}
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
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Costo Estimado (USD)</Label>
                <Input value={form.costoEstimado} onChange={(e) => set('costoEstimado', e.target.value)} inputMode="numeric" />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {guardado ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={guardar}>Guardar Cambios</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
