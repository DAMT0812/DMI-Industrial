import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { parqueById, type ProyectoCapex } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { formatMoneda, formatSuperficie } from '@/lib/format'

export function CapexTable() {
  const { moneda, unidad } = usePreferences()
  const { proyectosCapex, naveById } = useDataStore()
  const [seleccionado, setSeleccionado] = useState<ProyectoCapex | null>(null)
  const [votos, setVotos] = useState<Record<string, boolean>>({})

  const nave = seleccionado ? naveById(seleccionado.naveId) : null
  const parque = nave ? parqueById(nave.parqueId) : null

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
              const n = naveById(p.naveId)!
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
                    {votos[p.id] && <div className="mt-1 text-[11px] font-medium text-status-success">Voto registrado ✓</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSeleccionado(p)}>
                      Ver Ficha
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={seleccionado !== null} onOpenChange={(open) => !open && setSeleccionado(null)}>
        <DialogContent className="max-w-lg">
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
                    {seleccionado.cotizaciones.map((c) => (
                      <div key={c.proveedor} className="flex items-center justify-between rounded-sm border border-border px-2.5 py-1.5 text-xs">
                        <span className={c.proveedor === seleccionado.proveedorSeleccionado ? 'font-semibold text-status-success' : 'text-foreground'}>
                          {c.recibida ? c.proveedor : `${c.proveedor} — pendiente`}
                        </span>
                        {c.recibida && (
                          <span className="tabular text-muted-foreground">
                            {formatMoneda(c.monto, moneda)} · {c.garantiaMeses}m garantía
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                {seleccionado.estatusComite === 'En Revisión Comité' && !votos[seleccionado.id] && (
                  <Button onClick={() => setVotos((v) => ({ ...v, [seleccionado.id]: true }))}>Votar a Favor</Button>
                )}
                <Button variant="outline" onClick={() => setSeleccionado(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
