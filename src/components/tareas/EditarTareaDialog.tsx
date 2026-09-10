import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'
import type { TareaOperativa, CategoriaTarea, ColumnaKanban } from '@/data'

const CATEGORIAS: CategoriaTarea[] = [
  'Regulatorio Legal',
  'CapEx Prioritario',
  'Correctivo Inmediato',
  'Preventivo',
  'Mantenimiento Mayor',
  'Cobranza CAM',
  'Sanidad Operativa',
]

const COLUMNAS: ColumnaKanban[] = ['Por Iniciar', 'En Cotización', 'En Ejecución', 'Completado & Auditado']

interface FormState {
  titulo: string
  categoria: CategoriaTarea
  columna: ColumnaKanban
  responsable: string
  costoEstimado: string
  avancePct: string
  cotizacionesRecibidas: string
  slaRestanteHoras: string
}

function estadoDesdeTarea(t: TareaOperativa): FormState {
  return {
    titulo: t.titulo,
    categoria: t.categoria,
    columna: t.columna,
    responsable: t.responsable,
    costoEstimado: t.costoEstimado === null ? '' : String(t.costoEstimado),
    avancePct: t.avancePct === null ? '' : String(t.avancePct),
    cotizacionesRecibidas: t.cotizacionesRecibidas ?? '',
    slaRestanteHoras: t.slaRestanteHoras === null ? '' : String(t.slaRestanteHoras),
  }
}

export function EditarTareaDialog({
  open,
  onOpenChange,
  tarea,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tarea: TareaOperativa
}) {
  const { editarTarea } = useDataStore()
  const [form, setForm] = useState<FormState>(() => estadoDesdeTarea(tarea))
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(estadoDesdeTarea(tarea))
      setGuardado(false)
    }
  }, [open, tarea])

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function guardar() {
    editarTarea(tarea.id, {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      columna: form.columna,
      responsable: form.responsable.trim(),
      costoEstimado: form.costoEstimado.trim() === '' ? null : Number(form.costoEstimado),
      avancePct: form.avancePct.trim() === '' ? null : Number(form.avancePct),
      cotizacionesRecibidas: form.cotizacionesRecibidas.trim() === '' ? null : form.cotizacionesRecibidas.trim(),
      slaRestanteHoras: form.slaRestanteHoras.trim() === '' ? null : Number(form.slaRestanteHoras),
    })
    setGuardado(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>Los cambios se reflejan de inmediato en el Tablero Kanban de Centro de Tareas & CapEx.</DialogDescription>
        </DialogHeader>

        {guardado ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Tarea actualizada correctamente.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título</Label>
              <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Categoría</Label>
                <select
                  value={form.categoria}
                  onChange={(e) => set('categoria', e.target.value as CategoriaTarea)}
                  className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Columna del Kanban</Label>
                <select
                  value={form.columna}
                  onChange={(e) => set('columna', e.target.value as ColumnaKanban)}
                  className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                >
                  {COLUMNAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Responsable</Label>
              <Input value={form.responsable} onChange={(e) => set('responsable', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Costo Estimado (USD)</Label>
                <Input value={form.costoEstimado} onChange={(e) => set('costoEstimado', e.target.value)} inputMode="numeric" placeholder="Sin costo" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Avance (%)</Label>
                <Input value={form.avancePct} onChange={(e) => set('avancePct', e.target.value)} inputMode="numeric" placeholder="Sin avance" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cotizaciones Recibidas</Label>
                <Input value={form.cotizacionesRecibidas} onChange={(e) => set('cotizacionesRecibidas', e.target.value)} placeholder="Ej. 2/3 recibidas" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">SLA Restante (h)</Label>
                <Input value={form.slaRestanteHoras} onChange={(e) => set('slaRestanteHoras', e.target.value)} inputMode="numeric" placeholder="Sin SLA" />
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
