import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/context/DataStoreContext'
import type { ProyectoCapex } from '@/data'

interface FormState {
  titulo: string
  justificacionTecnica: string
  inversionEstimada: string
  roiProyectadoPct: string
  paybackAnios: string
}

function estadoDesdeProyecto(p: ProyectoCapex): FormState {
  return {
    titulo: p.titulo,
    justificacionTecnica: p.justificacionTecnica,
    inversionEstimada: String(p.inversionEstimada),
    roiProyectadoPct: String(p.roiProyectadoPct),
    paybackAnios: String(p.paybackAnios),
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
  const { editarCapex, cotizacionesPorProyecto, registrarCotizacionCapex, enviarCapexAComite } = useDataStore()
  const [form, setForm] = useState<FormState>(() => estadoDesdeProyecto(proyecto))
  const [guardado, setGuardado] = useState(false)
  const [proveedor, setProveedor] = useState('')
  const [monto, setMonto] = useState('')
  const [garantiaMeses, setGarantiaMeses] = useState('')
  const [proveedorGanador, setProveedorGanador] = useState('')
  const [avanceFisico, setAvanceFisico] = useState(String(proyecto.avanceFisicoPct))
  const [avanceFinanciero, setAvanceFinanciero] = useState(String(proyecto.avanceFinancieroPct))

  const cotizaciones = cotizacionesPorProyecto(proyecto.id)
  const cotizacionesRecibidas = cotizaciones.filter((c) => c.recibida)

  useEffect(() => {
    if (open) {
      setForm(estadoDesdeProyecto(proyecto))
      setGuardado(false)
      setProveedor('')
      setMonto('')
      setGarantiaMeses('')
      setProveedorGanador(proyecto.proveedorSeleccionado ?? '')
      setAvanceFisico(String(proyecto.avanceFisicoPct))
      setAvanceFinanciero(String(proyecto.avanceFinancieroPct))
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
            <Button size="sm" variant="outline" onClick={() => setGuardado(false)}>
              Seguir editando
            </Button>
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
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">ROI Proyectado (%)</Label>
                <Input value={form.roiProyectadoPct} onChange={(e) => set('roiProyectadoPct', e.target.value)} inputMode="numeric" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Payback (años)</Label>
                <Input value={form.paybackAnios} onChange={(e) => set('paybackAnios', e.target.value)} inputMode="decimal" />
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
                <StatusBadge estatus={proyecto.estatusComite} />
              </div>

              {proyecto.estatusComite === 'Pendiente 3ra Cotización' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Registrar cotización recibida</Label>
                    <Input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Proveedor" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto (USD)" inputMode="numeric" />
                      <Input value={garantiaMeses} onChange={(e) => setGarantiaMeses(e.target.value)} placeholder="Garantía (meses)" inputMode="numeric" />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-fit"
                      disabled={proveedor.trim().length === 0 || monto.trim().length === 0}
                      onClick={() => {
                        registrarCotizacionCapex(proyecto.id, { proveedor: proveedor.trim(), monto: Number(monto), garantiaMeses: Number(garantiaMeses || 0) })
                        setProveedor('')
                        setMonto('')
                        setGarantiaMeses('')
                      }}
                    >
                      Registrar Cotización
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="w-fit"
                    disabled={cotizacionesRecibidas.length < 2}
                    onClick={() => enviarCapexAComite(proyecto.id)}
                  >
                    Enviar a Revisión de Comité
                  </Button>
                  {cotizacionesRecibidas.length < 2 && (
                    <p className="text-[11px] text-muted-foreground">Se requieren al menos 2 cotizaciones recibidas para enviar a comité.</p>
                  )}
                </div>
              )}

              {proyecto.estatusComite === 'En Revisión Comité' && (
                <p className="text-xs text-muted-foreground">Esperando resolución del Comité de Dirección — ve la ficha del proyecto para consultar los votos.</p>
              )}

              {proyecto.estatusComite === 'Aprobado por Dirección' && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Proveedor ganador</Label>
                  <select
                    value={proveedorGanador}
                    onChange={(e) => setProveedorGanador(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm focus:border-brand-cobalt focus:outline-none"
                  >
                    <option value="">Selecciona un proveedor</option>
                    {cotizacionesRecibidas.map((c) => (
                      <option key={c.id} value={c.proveedor}>
                        {c.proveedor}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="w-fit"
                    disabled={proveedorGanador.trim().length === 0}
                    onClick={() => editarCapex(proyecto.id, { estatusComite: 'En Ejecución', proveedorSeleccionado: proveedorGanador })}
                  >
                    Iniciar Ejecución
                  </Button>
                </div>
              )}

              {proyecto.estatusComite === 'En Ejecución' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Avance Físico (%)</Label>
                      <Input value={avanceFisico} onChange={(e) => setAvanceFisico(e.target.value)} inputMode="numeric" />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Avance Financiero (%)</Label>
                      <Input value={avanceFinanciero} onChange={(e) => setAvanceFinanciero(e.target.value)} inputMode="numeric" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editarCapex(proyecto.id, { avanceFisicoPct: Number(avanceFisico), avanceFinancieroPct: Number(avanceFinanciero) })}
                    >
                      Guardar Avance
                    </Button>
                    <Button size="sm" onClick={() => editarCapex(proyecto.id, { estatusComite: 'Concluido', avanceFisicoPct: 100, avanceFinancieroPct: 100 })}>
                      Marcar Concluido
                    </Button>
                  </div>
                </div>
              )}

              {proyecto.estatusComite === 'Rechazado' && proyecto.motivoRechazo && (
                <p className="text-xs text-muted-foreground">Motivo de rechazo: {proyecto.motivoRechazo}</p>
              )}
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
