import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'
import type { ContratoArrendamiento, TipoContrato } from '@/data'

const TIPOS_CONTRATO: TipoContrato[] = ['Triple Net (NNN)', 'Doble Neto (NN)', 'Bruto Modificado']

interface FormState {
  tipoContrato: TipoContrato
  fechaInicio: string
  fechaVencimiento: string
  plazoMeses: string
  rentaBaseMensual: string
  tarifaPorM2: string
  cam: string
  depositoGarantia: string
  esquemaIncremento: string
  opcionesRenovacion: string
  avalista: string
}

function estadoDesdeContrato(c: ContratoArrendamiento): FormState {
  return {
    tipoContrato: c.tipoContrato,
    fechaInicio: c.fechaInicio,
    fechaVencimiento: c.fechaVencimiento,
    plazoMeses: String(c.plazoMeses),
    rentaBaseMensual: String(c.rentaBaseMensual),
    tarifaPorM2: String(c.tarifaPorM2),
    cam: String(c.cam),
    depositoGarantia: String(c.depositoGarantia),
    esquemaIncremento: c.esquemaIncremento,
    opcionesRenovacion: c.opcionesRenovacion,
    avalista: c.avalista,
  }
}

export function EditarContratoDialog({
  open,
  onOpenChange,
  contrato,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contrato: ContratoArrendamiento
}) {
  const { editarContrato } = useDataStore()
  const [form, setForm] = useState<FormState>(() => estadoDesdeContrato(contrato))
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(estadoDesdeContrato(contrato))
      setGuardado(false)
    }
  }, [open, contrato])

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function guardar() {
    editarContrato(contrato.id, {
      tipoContrato: form.tipoContrato,
      fechaInicio: form.fechaInicio,
      fechaVencimiento: form.fechaVencimiento,
      plazoMeses: Number(form.plazoMeses),
      rentaBaseMensual: Number(form.rentaBaseMensual),
      tarifaPorM2: Number(form.tarifaPorM2),
      cam: Number(form.cam),
      depositoGarantia: Number(form.depositoGarantia),
      esquemaIncremento: form.esquemaIncremento.trim(),
      opcionesRenovacion: form.opcionesRenovacion.trim(),
      avalista: form.avalista.trim(),
    })
    setGuardado(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato de Arrendamiento</DialogTitle>
          <DialogDescription>Los cambios se reflejan de inmediato en el Expediente 360°, el Directorio y las alertas de vencimiento.</DialogDescription>
        </DialogHeader>

        {guardado ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Contrato actualizado correctamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Tipo de Contrato">
              <select
                value={form.tipoContrato}
                onChange={(e) => set('tipoContrato', e.target.value as TipoContrato)}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                {TIPOS_CONTRATO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Plazo Forzoso (meses)">
              <Input value={form.plazoMeses} onChange={(e) => set('plazoMeses', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Fecha de Inicio">
              <Input type="date" value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} />
            </Campo>
            <Campo label="Fecha de Vencimiento">
              <Input type="date" value={form.fechaVencimiento} onChange={(e) => set('fechaVencimiento', e.target.value)} />
            </Campo>
            <Campo label="Renta Base Mensual (USD)">
              <Input value={form.rentaBaseMensual} onChange={(e) => set('rentaBaseMensual', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Tarifa por m² (USD)">
              <Input value={form.tarifaPorM2} onChange={(e) => set('tarifaPorM2', e.target.value)} inputMode="decimal" />
            </Campo>
            <Campo label="CAM Mensual (USD)">
              <Input value={form.cam} onChange={(e) => set('cam', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Depósito en Garantía (USD)">
              <Input value={form.depositoGarantia} onChange={(e) => set('depositoGarantia', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Esquema de Incremento" full>
              <Input value={form.esquemaIncremento} onChange={(e) => set('esquemaIncremento', e.target.value)} placeholder="4% anual fijo" />
            </Campo>
            <Campo label="Opciones de Renovación" full>
              <Input value={form.opcionesRenovacion} onChange={(e) => set('opcionesRenovacion', e.target.value)} placeholder="1 periodo de 3 años" />
            </Campo>
            <Campo label="Avalista" full>
              <Input value={form.avalista} onChange={(e) => set('avalista', e.target.value)} />
            </Campo>
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

function Campo({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
