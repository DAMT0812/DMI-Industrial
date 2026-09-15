import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'

interface FormState {
  naveId: string
  titulo: string
  justificacionTecnica: string
  inversionEstimada: string
  roiProyectadoPct: string
  paybackAnios: string
}

const ESTADO_INICIAL: FormState = {
  naveId: '',
  titulo: '',
  justificacionTecnica: '',
  inversionEstimada: '',
  roiProyectadoPct: '',
  paybackAnios: '',
}

export function NuevoCapexDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { naves, parqueById, agregarProyectoCapex } = useDataStore()
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [creado, setCreado] = useState(false)

  const navesOrdenadas = [...naves].sort((a, b) => a.folio.localeCompare(b.folio))

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function alAbrir(abierto: boolean) {
    if (abierto) {
      setForm(ESTADO_INICIAL)
      setCreado(false)
    }
    onOpenChange(abierto)
  }

  function crear() {
    agregarProyectoCapex({
      naveId: form.naveId,
      titulo: form.titulo.trim(),
      justificacionTecnica: form.justificacionTecnica.trim(),
      inversionEstimada: Number(form.inversionEstimada),
      roiProyectadoPct: form.roiProyectadoPct.trim() === '' ? 0 : Number(form.roiProyectadoPct),
      paybackAnios: form.paybackAnios.trim() === '' ? 0 : Number(form.paybackAnios),
    })
    setCreado(true)
  }

  const formValido = form.naveId !== '' && form.titulo.trim() !== '' && form.justificacionTecnica.trim() !== '' && form.inversionEstimada.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={alAbrir}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de CapEx</DialogTitle>
          <DialogDescription>El proyecto entra a la cartera en estatus "Pendiente 3ra Cotización", listo para recibir cotizaciones.</DialogDescription>
        </DialogHeader>

        {creado ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Proyecto CapEx creado correctamente.</p>
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
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título</Label>
              <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Justificación Técnica</Label>
              <Textarea value={form.justificacionTecnica} onChange={(e) => set('justificacionTecnica', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Inversión Estimada (USD)</Label>
                <Input value={form.inversionEstimada} onChange={(e) => set('inversionEstimada', e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">ROI Proyectado (%)</Label>
                <Input value={form.roiProyectadoPct} onChange={(e) => set('roiProyectadoPct', e.target.value)} inputMode="numeric" placeholder="Opcional" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Payback (años)</Label>
                <Input value={form.paybackAnios} onChange={(e) => set('paybackAnios', e.target.value)} inputMode="decimal" placeholder="Opcional" />
              </div>
            </div>
          </div>
        )}

        {!creado && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!formValido} onClick={crear}>
              Crear Proyecto
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
