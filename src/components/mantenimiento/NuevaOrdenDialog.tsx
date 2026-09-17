import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'
import { type PrioridadTicket } from '@/data'

const PRIORIDADES: PrioridadTicket[] = ['Crítica', 'Alta', 'Media', 'Baja']

interface FormState {
  naveId: string
  categoria: string
  descripcion: string
  prioridad: PrioridadTicket
  contratistaId: string
  costoEstimado: string
}

const ESTADO_INICIAL: FormState = {
  naveId: '',
  categoria: '',
  descripcion: '',
  prioridad: 'Media',
  contratistaId: '',
  costoEstimado: '',
}

export function NuevaOrdenDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { naves, parqueById, contratistas, slaHoras, agregarOrden } = useDataStore()
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [creada, setCreada] = useState(false)

  const navesOrdenadas = [...naves].sort((a, b) => a.folio.localeCompare(b.folio))

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function alAbrir(abierto: boolean) {
    if (abierto) {
      setForm(ESTADO_INICIAL)
      setCreada(false)
    }
    onOpenChange(abierto)
  }

  function crear() {
    agregarOrden({
      naveId: form.naveId,
      categoria: form.categoria.trim(),
      descripcion: form.descripcion.trim(),
      prioridad: form.prioridad,
      contratistaId: form.contratistaId,
      costoEstimado: Number(form.costoEstimado),
    })
    setCreada(true)
  }

  const formValido =
    form.naveId !== '' && form.categoria.trim() !== '' && form.descripcion.trim() !== '' && form.contratistaId !== '' && form.costoEstimado.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={alAbrir}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Orden de Trabajo</DialogTitle>
          <DialogDescription>La orden entra al tablero de mantenimiento en estatus "Abierta", con el SLA de la prioridad elegida.</DialogDescription>
        </DialogHeader>

        {creada ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Orden de trabajo creada correctamente.</p>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nave</Label>
              <select
                value={form.naveId}
                onChange={(e) => set('naveId', e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                <option value="">Selecciona una nave</option>
                {navesOrdenadas.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.folio} — {parqueById(n.parqueId)?.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Categoría / Sistema</Label>
              <Input value={form.categoria} onChange={(e) => set('categoria', e.target.value)} placeholder="Ej. HVAC, Cubiertas y Techos…" />
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
                  <option value="">Selecciona un contratista</option>
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
          </div>
        )}

        {!creada && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!formValido} onClick={crear}>
              Crear Orden
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
