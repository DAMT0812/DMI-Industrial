import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pencil, Search } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AltaInmuebleDialog } from '@/components/portafolio/AltaInmuebleDialog'
import { parqueById, inquilinoPorNaveId, inquilinoById, type EstatusOperativo, type Nave } from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { formatMoneda, formatSuperficie } from '@/lib/format'
import { diasParaVencer, mesesRestantes } from '@/lib/dates'

const PAGE_SIZE = 8
const TODOS_ESTATUS = 'Todos' as const

export function DirectorioNavesTable() {
  const { moneda, unidad, parqueSeleccionado, perfilSimulado } = usePreferences()
  const { naves, contratoPorNaveId } = useDataStore()
  const [busqueda, setBusqueda] = useState('')
  const [estatusFiltro, setEstatusFiltro] = useState<EstatusOperativo | typeof TODOS_ESTATUS>(TODOS_ESTATUS)
  const [pagina, setPagina] = useState(0)
  const [naveEnEdicion, setNaveEnEdicion] = useState<Nave | null>(null)

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return naves
      .filter((n) => perfilSimulado.region === 'todas' || parqueById(n.parqueId)?.region === perfilSimulado.region)
      .filter((n) => parqueSeleccionado === 'todos' || n.parqueId === parqueSeleccionado)
      .filter((n) => estatusFiltro === TODOS_ESTATUS || n.estatusOperativo === estatusFiltro)
      .filter((n) => {
        if (!q) return true
        const parque = parqueById(n.parqueId)
        const inquilino = inquilinoById(inquilinoPorNaveId[n.id] ?? '')
        return (
          n.folio.toLowerCase().includes(q) ||
          parque?.nombre.toLowerCase().includes(q) ||
          inquilino?.nombreComercial.toLowerCase().includes(q)
        )
      })
  }, [naves, busqueda, estatusFiltro, parqueSeleccionado, perfilSimulado])

  const totalPaginas = Math.max(1, Math.ceil(filas.length / PAGE_SIZE))
  const paginaSegura = Math.min(pagina, totalPaginas - 1)
  const filasPagina = filas.slice(paginaSegura * PAGE_SIZE, paginaSegura * PAGE_SIZE + PAGE_SIZE)

  const estatusOpciones: (EstatusOperativo | typeof TODOS_ESTATUS)[] = [
    TODOS_ESTATUS,
    'Óptimo Operativo',
    'Alerta Predial Pendiente',
    'En Renovación Formal',
    'Mant. Preventivo HVAC',
    'En Mora',
  ]

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Directorio Operativo de Naves y Complejos</h3>
          <p className="text-xs text-muted-foreground">
            {filas.length} activos coinciden con los filtros aplicados
            {perfilSimulado.region !== 'todas' && ` · restringido a la región ${perfilSimulado.region} (rol ${perfilSimulado.puesto})`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(0)
              }}
              placeholder="Filtrar por inquilino, parque o folio…"
              className="h-8 w-56 rounded-md border border-border bg-surface-secondary pl-8 pr-2 text-xs focus:border-brand-cobalt focus:bg-card focus:outline-none"
            />
          </div>
          <select
            value={estatusFiltro}
            onChange={(e) => {
              setEstatusFiltro(e.target.value as EstatusOperativo | typeof TODOS_ESTATUS)
              setPagina(0)
            }}
            className="h-8 rounded-md border border-border bg-surface-secondary px-2 text-xs focus:border-brand-cobalt focus:outline-none"
          >
            {estatusOpciones.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parque & Nave Industrial</TableHead>
              <TableHead>Inquilino Corporativo</TableHead>
              <TableHead className="text-right">Área (GLA)</TableHead>
              <TableHead className="text-right">Renta Mensual</TableHead>
              <TableHead>Vigencia de Contrato</TableHead>
              <TableHead>Estatus Operativo</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filasPagina.map((nave) => {
              const parque = parqueById(nave.parqueId)!
              const inquilino = inquilinoById(inquilinoPorNaveId[nave.id] ?? '')
              const contrato = contratoPorNaveId(nave.id)
              const diasRestantes = contrato ? diasParaVencer(contrato.fechaVencimiento) : null

              return (
                <TableRow key={nave.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{parque.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      Nave {nave.numeroNave} · {nave.folio}
                    </div>
                  </TableCell>
                  <TableCell>{inquilino ? inquilino.nombreComercial : <span className="text-muted-foreground italic">Disponible</span>}</TableCell>
                  <TableCell className="tabular text-right">{formatSuperficie(nave.gla, unidad)}</TableCell>
                  <TableCell className="tabular text-right">
                    {contrato ? (
                      <>
                        <div className="text-metric-dual-primary">{formatMoneda(contrato.rentaBaseMensual, moneda)}</div>
                        <div className="text-metric-dual-secondary text-muted-foreground">${contrato.tarifaPorM2.toFixed(2)} USD/m²</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {contrato ? (
                      <>
                        <div className="tabular text-foreground">{mesesRestantes(contrato.fechaVencimiento)} meses</div>
                        <div className={`tabular text-xs ${diasRestantes! <= 90 ? 'font-semibold text-status-danger' : 'text-muted-foreground'}`}>
                          {diasRestantes} días restantes
                        </div>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estatus={nave.estatusOperativo} />
                    {nave.id.startsWith('NAVE-NEW') && (
                      <div className="mt-1">
                        <StatusBadge estatus="Expediente Incompleto" tono="warning" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="icon-sm" variant="outline" className="h-7 w-7" aria-label="Editar inmueble" onClick={() => setNaveEnEdicion(nave)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" nativeButton={false} render={<Link to={`/naves/${nave.id}`} />}>
                        Ver 360°
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filasPagina.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Ninguna nave coincide con los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">
          Página {paginaSegura + 1} de {totalPaginas}
        </span>
        <div className="flex items-center gap-1.5">
          <Button size="icon-sm" variant="outline" disabled={paginaSegura === 0} onClick={() => setPagina((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={paginaSegura >= totalPaginas - 1}
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AltaInmuebleDialog
        open={naveEnEdicion !== null}
        onOpenChange={(open) => !open && setNaveEnEdicion(null)}
        naveExistente={naveEnEdicion ?? undefined}
      />
    </div>
  )
}
