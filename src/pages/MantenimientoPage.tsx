import { useState } from 'react'
import { AlertOctagon, ClipboardCheck, Clock, Download, DollarSign, PlusCircle, Star, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KpiCard } from '@/components/shared/KpiCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AprobarRechazarDialog } from '@/components/shared/AprobarRechazarDialog'
import { CalendarioMantenimiento } from '@/components/mantenimiento/CalendarioMantenimiento'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import {
  matrizConfiabilidad,
  contratistas,
  parqueById,
  contratistaById,
  pmCumplimientoPct,
  PM_CUMPLIDAS,
  PM_META_ANUAL,
  opexEjecutadoPct,
  OPEX_EJECUTADO_YTD_USD,
  OPEX_PRESUPUESTO_ANUAL_USD,
  SLA_META_HORAS,
  type OrdenTrabajo,
} from '@/data'
import { HOY } from '@/lib/dates'
import { formatMoneda, formatPct } from '@/lib/format'

export function MantenimientoPage() {
  const { moneda, perfilSimulado } = usePreferences()
  const {
    ordenesTrabajo,
    naveById,
    proyectoMayorEnCurso: proyectoMayor,
    correctivosActivos: correctivos,
    capexAutorizadoAnio,
    capexProyectosMayores,
    slaPromedioResolucionHoras,
    editarOrden,
  } = useDataStore()
  const naveProyecto = proyectoMayor ? naveById(proyectoMayor.naveId) : null
  const parqueProyecto = naveProyecto ? parqueById(naveProyecto.parqueId) : null

  // Interacción ligera de la maqueta (sin persistir entre sesiones): cambia el
  // estado real de la orden vía DataStoreContext cuando el Facility Manager
  // valida o rechaza el cierre de una orden en "Pendiente de Evidencia" — el
  // cambio se refleja en todas las pantallas que lean esta misma orden.
  const [otParaValidar, setOtParaValidar] = useState<OrdenTrabajo | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-cobalt">
            Asset Class: Logística & Manufactura Clase A · T3 2026
          </div>
          <h1 className="mt-1 text-headline-lg-mobile sm:text-headline-lg text-primary">Supervisión Operativa & Mantenimiento Institucional</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar Bitácora PDF
          </Button>
          <Button className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Crear Orden de Trabajo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          etiqueta="Cumplimiento PM"
          icono={Wrench}
          valor={formatPct(pmCumplimientoPct())}
          detalle={`${PM_CUMPLIDAS}/${PM_META_ANUAL} mantenimientos programados`}
          progreso={pmCumplimientoPct()}
        />
        <KpiCard
          etiqueta="Correctivos Activos"
          icono={AlertOctagon}
          valor={String(correctivos.total)}
          detalle={`${correctivos.alta} alta · ${correctivos.media} media · ${correctivos.baja} baja`}
        />
        <KpiCard
          etiqueta="OpEx YTD vs Presupuesto"
          icono={DollarSign}
          valor={formatMoneda(OPEX_EJECUTADO_YTD_USD, moneda)}
          detalle={`${formatPct(opexEjecutadoPct())} de ${formatMoneda(OPEX_PRESUPUESTO_ANUAL_USD, moneda)}`}
          progreso={opexEjecutadoPct()}
        />
        <KpiCard
          etiqueta="CapEx Autorizado"
          icono={DollarSign}
          valor={formatMoneda(capexAutorizadoAnio, moneda)}
          detalle={`${capexProyectosMayores} proyectos mayores`}
        />
        <KpiCard
          etiqueta="SLA Promedio de Resolución"
          icono={Clock}
          valor={`${slaPromedioResolucionHoras} h`}
          detalle={`Meta interna ${SLA_META_HORAS} h`}
        />
      </div>

      {proyectoMayor && (
        <div className="rounded-lg border border-brand-cobalt/30 bg-brand-cobalt/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge estatus="En Ejecución" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Programa Activo de Reposición Patrimonial
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-foreground">{proyectoMayor.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {parqueProyecto?.nombre} — Nave {naveProyecto?.numeroNave} · {proyectoMayor.codigo}
              </p>
            </div>
            <div className="w-full sm:w-64">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Avance físico global</span>
                <span className="tabular text-primary">{proyectoMayor.avanceFisicoPct}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
                <div className="h-full rounded-full bg-brand-cobalt" style={{ width: `${proyectoMayor.avanceFisicoPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Matriz de Confiabilidad por Sistema Crítico</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {matrizConfiabilidad.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="text-sm font-semibold text-foreground">{s.sistema}</div>
                <div className="text-[11px] text-muted-foreground">{s.codigoReferencia}</div>
                <p className="mt-2 text-xs leading-snug text-muted-foreground">{s.descripcionIntervencion}</p>
                <div className="mt-3">
                  <StatusBadge estatus={s.indicador} tono={s.estatusSalud === 'Óptimo' ? 'success' : s.estatusSalud === 'Alerta' ? 'warning' : 'danger'} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Tablero de Mantenimiento Correctivo & Órdenes de Trabajo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID / Prioridad</TableHead>
                    <TableHead>Ubicación & Sistema</TableHead>
                    <TableHead>Proveedor Asignado</TableHead>
                    <TableHead className="text-right">Costo Estimado</TableHead>
                    <TableHead>SLA / Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesTrabajo
                    .filter((o) => o.estatus !== 'Validado' && o.estatus !== 'Cancelada')
                    .filter((o) => perfilSimulado.region === 'todas' || parqueById(naveById(o.naveId)!.parqueId)?.region === perfilSimulado.region)
                    .map((o) => {
                      const nave = naveById(o.naveId)!
                      const parque = parqueById(nave.parqueId)!
                      const contratista = contratistaById(o.contratistaId)
                      const estatus = o.estatus
                      return (
                        <TableRow key={o.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">{o.folio}</div>
                            <StatusBadge estatus={o.prioridad} />
                          </TableCell>
                          <TableCell>
                            <div className="text-foreground">{o.categoria}</div>
                            <div className="text-xs text-muted-foreground">
                              {parque.nombre} — Nave {nave.numeroNave}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{contratista?.nombre}</TableCell>
                          <TableCell className="tabular text-right">{formatMoneda(o.costoEstimado, moneda)}</TableCell>
                          <TableCell>
                            <div className="tabular text-xs text-muted-foreground">SLA {o.slaHoras}h</div>
                            <StatusBadge estatus={estatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            {estatus === 'Pendiente de Evidencia' && (
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setOtParaValidar(o)}>
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Validar Cierre
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Padrón de Contratistas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {contratistas.map((c) => (
              <div key={c.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{c.nombre}</div>
                    <div className="text-xs text-muted-foreground">{c.especialidad}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 text-status-warning">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="tabular text-xs font-semibold">{c.calificacion.toFixed(1)}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge estatus={c.polizaRC} tono={c.polizaRC === 'Vigente' ? 'success' : c.polizaRC === 'Por Vencer' ? 'warning' : 'danger'} />
                  <span className="tabular text-[11px] text-muted-foreground">{c.trabajosDelAno} trabajos/año</span>
                  <span className="tabular text-[11px] text-muted-foreground">{c.porcentajeOnTime}% on-time</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Calendario Mensual de Ventanas de Mantenimiento & Paros Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarioMantenimiento />
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Activos Monitoreados</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {matrizConfiabilidad.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex h-24 items-center justify-center bg-surface-secondary text-muted-foreground">
                <Wrench className="h-8 w-8" />
              </div>
              <div className="p-3">
                <div className="truncate text-sm font-medium text-foreground">{s.sistema}</div>
                <div className="mt-1.5">
                  <StatusBadge estatus={s.estatusSalud} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AprobarRechazarDialog
        open={otParaValidar !== null}
        onOpenChange={(open) => !open && setOtParaValidar(null)}
        titulo={otParaValidar ? `Validar cierre — ${otParaValidar.folio}` : ''}
        descripcion={otParaValidar ? `${otParaValidar.categoria} — ${otParaValidar.descripcion}` : undefined}
        etiquetaAprobar="Validar y Cerrar"
        etiquetaRechazar="Rechazar Cierre"
        onAprobar={() => otParaValidar && editarOrden(otParaValidar.id, { estatus: 'Validado', fechaCierre: HOY.toISOString().slice(0, 10) })}
        onRechazar={() => otParaValidar && editarOrden(otParaValidar.id, { estatus: 'En ejecución' })}
      />
    </div>
  )
}
