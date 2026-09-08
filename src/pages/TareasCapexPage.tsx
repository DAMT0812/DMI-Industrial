import { AlertTriangle, Clock, PlusCircle, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiCard } from '@/components/shared/KpiCard'
import { AlertaCard } from '@/components/shared/AlertaCard'
import { KanbanBoard } from '@/components/tareas/KanbanBoard'
import { CapexTable } from '@/components/tareas/CapexTable'
import { CotizacionCard } from '@/components/tareas/CotizacionCard'
import { TareasVivasFlow } from '@/components/tareas/TareasVivasFlow'
import { usePreferences } from '@/context/PreferencesContext'
import {
  alertas,
  proyectosCapex,
  solicitudesCotizacion,
  tareasVivas,
  CAPEX_BOLSA_ANUAL_USD,
  capexAutorizadoTotal,
  capexDisponiblePct,
} from '@/data'
import { formatMoneda, formatPct } from '@/lib/format'

export function TareasCapexPage() {
  const { moneda } = usePreferences()

  const vencimientosCriticos = alertas.filter((a) => a.urgencia === 'Crítico Inminente' && a.tipo !== 'SLA de Ticket').length
  const capexEnRevision = proyectosCapex.filter((p) => p.estatusComite === 'En Revisión Comité').length

  const urgentes = tareasVivas.filter((t) => t.columna === 'urgente').length
  const enProceso = tareasVivas.filter((t) => t.columna === 'en-ejecucion').length
  const esperandoCotizacion = solicitudesCotizacion.filter((s) => s.recibidas < s.total).length
  const completadas = tareasVivas.filter((t) => t.columna === 'completada')
  const completadasAuditadasPct = completadas.length
    ? Math.round((completadas.filter((t) => t.estatusCierre === 'Cerrado & Auditado').length / completadas.length) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-cobalt">Asset Management Ops · Q3 Fiscal 2026</div>
          <h1 className="mt-1 text-2xl font-bold text-primary">Centro de Tareas, CapEx & Vencimientos</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-status-danger">
              <AlertTriangle className="h-3.5 w-3.5" /> {vencimientosCriticos} vencimientos inminentes
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-brand-cobalt">
              <Wallet className="h-3.5 w-3.5" /> {capexEnRevision} CapEx en revisión de comité
            </span>
          </div>
        </div>
        <Button className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          Nueva Solicitud de CapEx
        </Button>
      </div>

      <Tabs defaultValue="tareas-capex">
        <TabsList>
          <TabsTrigger value="tareas-capex">Tareas & CapEx</TabsTrigger>
          <TabsTrigger value="tareas-vivas">Tareas Vivas & Cotizaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="tareas-capex" className="mt-5 flex flex-col gap-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Timeline de Vencimientos Críticos y Calendario Patrimonial</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {alertas
                .filter((a) => a.tipo !== 'SLA de Ticket')
                .map((a) => (
                  <AlertaCard key={a.id} alerta={a} />
                ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Tablero Kanban de Tareas Operativas y Mantenimiento</h3>
            <KanbanBoard />
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Cartera de Proyectos de Inversión Patrimonial (CapEx)</h3>
              <span className="tabular text-xs text-muted-foreground">
                Bolsa autorizada {formatMoneda(CAPEX_BOLSA_ANUAL_USD, moneda)} · {formatPct(capexDisponiblePct())} disponible ·{' '}
                {formatMoneda(capexAutorizadoTotal(), moneda)} comprometido
              </span>
            </div>
            <CapexTable />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Comparativa de Proveedores en Curso</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {solicitudesCotizacion.slice(0, 2).map((s) => (
                <CotizacionCard key={s.id} solicitud={s} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tareas-vivas" className="mt-5 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard etiqueta="Urgentes / <48h" icono={AlertTriangle} valor={String(urgentes)} detalle="Requieren atención inmediata" />
            <KpiCard etiqueta="En Proceso / Campo" icono={Clock} valor={String(enProceso)} detalle="Cuadrillas activas en sitio" />
            <KpiCard etiqueta="Esperando Cotización" icono={Wallet} valor={String(esperandoCotizacion)} detalle="RFP con propuestas pendientes" />
            <KpiCard
              etiqueta="Completadas este Mes"
              icono={Clock}
              valor={String(completadas.length)}
              detalle={`${formatPct(completadasAuditadasPct)} cerrado & auditado`}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Flujo de Tareas Vivas</h3>
            <TareasVivasFlow />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Hub de Cotizaciones & Proveedores en Tiempo Real</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {solicitudesCotizacion.map((s) => (
                <CotizacionCard key={s.id} solicitud={s} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
