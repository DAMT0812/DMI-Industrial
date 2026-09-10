import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'
import type { ProyectoCapex, EstatusComiteCapex } from '@/data'

const ESTATUS_COMITE: EstatusComiteCapex[] = [
  'Pendiente 3ra Cotización',
  'En Revisión Comité',
  'Aprobado por Dirección',
  'En Ejecución',
  'Concluido',
  'Rechazado',
]

interface FormState {
  titulo: string
  justificacionTecnica: string
  inversionEstimada: string
  roiProyectadoPct: string
  paybackAnios: string
  estatusComite: EstatusComiteCapex
  avanceFisicoPct: string
  avanceFinancieroPct: string
}

function estadoDesdeProyecto(p: ProyectoCapex): FormState {
  return {
    titulo: p.titulo,
    justificacionTecnica: p.justificacionTecnica,
    inversionEstimada: String(p.inversionEstimada),
    roiProyectadoPct: String(p.roiProyectadoPct),
    paybackAnios: String(p.paybackAnios),
    estatusComite: p.estatusComite,
    avanceFisicoPct: String(p.avanceFisicoPct),
    avanceFinancieroPct: String(p.avanceFinancieroPct),
  }
}

export function EditarCapexDialog({
  open,
  onOpenChange,
  proyecto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyecto: ProyectoCapex
}) {
  const { editarCapex } = useDataStore()
  const [form, setForm] = useState<FormState>(() => estadoDesdeProyecto(proyecto))
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(estadoDesdeProyecto(proyecto))
      setGuardado(false)
    }
  }, [open, proyecto])

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function guardar() {
    editarCapex(proyecto.id, {
      titulo: form.titulo.trim(),
      justificacionTecnica: form.justificacionTecnica.trim(),
      inversionEstimada: Number(form.inversionEstimada),
      roiProyectadoPct: Number(form.roiProyectadoPct),
      paybackAnios: Number(form.paybackAnios),
      estatusComite: form.estatusComite,
      avanceFisicoPct: Number(form.avanceFisicoPct),
      avanceFinancieroPct: Number(form.avanceFinancieroPct),
    })
    setGuardado(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proyecto CapEx — {proyecto.codigo}</DialogTitle>
          <DialogDescription>
            Los cambios se reflejan de inmediato en la Cartera de CapEx y el CapEx Autorizado del portafolio y de Mantenimiento.
          </DialogDescription>
        </DialogHeader>

        {guardado ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Proyecto {proyecto.codigo} actualizado correctamente.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título</Label>
              <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Justificación Técnica</Label>
              <Textarea value={form.justificacionTecnica} onChange={(e) => set('justificacionTecnica', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Inversión Estimada (USD)</Label>
                <Input value={form.inversionEstimada} onChange={(e) => set('inversionEstimada', e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estatus del Comité</Label>
                <select
                  value={form.estatusComite}
                  onChange={(e) => set('estatusComite', e.target.value as EstatusComiteCapex)}
                  className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                >
                  {ESTATUS_COMITE.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">ROI Proyectado (%)</Label>
                <Input value={form.roiProyectadoPct} onChange={(e) => set('roiProyectadoPct', e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Payback (años)</Label>
                <Input value={form.paybackAnios} onChange={(e) => set('paybackAnios', e.target.value)} inputMode="decimal" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Avance Físico (%)</Label>
                <Input value={form.avanceFisicoPct} onChange={(e) => set('avanceFisicoPct', e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Avance Financiero (%)</Label>
                <Input value={form.avanceFinancieroPct} onChange={(e) => set('avanceFinancieroPct', e.target.value)} inputMode="numeric" />
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
