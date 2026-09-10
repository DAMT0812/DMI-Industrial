import { Award, Building2, DollarSign, Download, Gauge, Percent, PlusCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/shared/KpiCard'
import { AlertaCard } from '@/components/shared/AlertaCard'
import { NoiLineChart } from '@/components/portafolio/NoiLineChart'
import { IndustriaDonutChart } from '@/components/portafolio/IndustriaDonutChart'
import { DirectorioNavesTable } from '@/components/portafolio/DirectorioNavesTable'
import { AltaInmuebleDialog } from '@/components/portafolio/AltaInmuebleDialog'
import { PillToggle } from '@/components/shared/ToggleGroup'
import { usePreferences } from '@/context/PreferencesContext'
import {
  alertas,
  requerimientosCriticos,
  vencimientosContrato90Dias,
  totalNaves,
  navesOcupadas,
  ocupacionGlobalPct,
  glaTotal,
  glaDisponible,
  ingresoMensualTotalUSD,
  PRESUPUESTO_MENSUAL_USD,
  cobranzaAlDiaPct,
  certificacionesLEEDCount,
  cumplimientoSTPSPromedio,
  parques,
  CAPEX_BOLSA_ANUAL_USD,
  capexAutorizadoTotal,
} from '@/data'
import { formatMoneda, formatPct, formatSuperficie } from '@/lib/format'
import { useState } from 'react'

const PERIODOS = ['T1 2026', 'T2 2026', 'T3 2026'] as const

export function PortafolioPage() {
  const { moneda, unidad } = usePreferences()
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>('T3 2026')
  const [altaAbierta, setAltaAbierta] = useState(false)

  const ocupacion = ocupacionGlobalPct()
  const ingresoMensual = ingresoMensualTotalUSD()
  const varianzaPresupuesto = Math.round(((ingresoMensual - PRESUPUESTO_MENSUAL_USD) / PRESUPUESTO_MENSUAL_USD) * 1000) / 10
  const requerimientos = requerimientosCriticos()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-cobalt">
            Portafolio Institucional / Consolidado Nacional · {periodo}
          </div>
          <h1 className="mt-1 text-headline-lg-mobile sm:text-headline-lg text-primary">Supervisión Ejecutiva de Activos Industriales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {parques.length} parques industriales · {totalNaves()} naves · cobertura Bajío, Norte y Occidente
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillToggle value={periodo} options={PERIODOS.map((p) => ({ value: p, label: p }))} onChange={setPeriodo} />
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar Reporte CapEx/NOI
          </Button>
          <Button className="gap-1.5" onClick={() => setAltaAbierta(true)}>
            <PlusCircle className="h-4 w-4" />
            Alta de Inmueble
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          etiqueta="Ocupación Global"
          icono={Building2}
          valor={formatPct(ocupacion)}
          detalle={`${navesOcupadas()} de ${totalNaves()} naves ocupadas`}
          progreso={ocupacion}
        />
        <KpiCard
          etiqueta="Área Bruta (GLA)"
          icono={Gauge}
          valor={formatSuperficie(glaTotal(), unidad)}
          detalle={`${formatSuperficie(glaDisponible(), unidad)} disponibles`}
        />
        <KpiCard
          etiqueta="Ingreso Mensual (NOI)"
          icono={DollarSign}
          valor={formatMoneda(ingresoMensual, moneda)}
          detalle={`Tipo de cambio 18.42 · ${varianzaPresupuesto >= 0 ? '+' : ''}${varianzaPresupuesto}% vs. presupuesto`}
          tendencia={{ valor: `${Math.abs(varianzaPresupuesto)}%`, positiva: varianzaPresupuesto >= 0 }}
        />
        <KpiCard
          etiqueta="Cobranza & SLAs"
          icono={Percent}
          valor={formatPct(cobranzaAlDiaPct())}
          detalle="Facturación cobrada / timbrada al día"
        />
        <KpiCard
          etiqueta="Vencimientos ≤ 90 días"
          icono={ShieldCheck}
          valor={String(vencimientosContrato90Dias())}
          detalle="Contratos en negociación activa"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Proyección Anual de Ingresos Operativos (NOI)</CardTitle>
            <span className="tabular text-xs font-medium text-muted-foreground">Cap Rate {8.4}%</span>
          </CardHeader>
          <CardContent>
            <NoiLineChart moneda={moneda} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Diversificación de Cartera por Industria</CardTitle>
          </CardHeader>
          <CardContent>
            <IndustriaDonutChart unidad={unidad} />
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Alertas Operativas y Regulatorias en Tiempo Real</h3>
          <span className="rounded-full bg-status-danger-bg px-2.5 py-1 text-xs font-semibold text-status-danger">
            {requerimientos} Requerimientos Críticos
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {alertas.slice(0, 6).map((a) => (
            <AlertaCard key={a.id} alerta={a} />
          ))}
        </div>
      </div>

      <DirectorioNavesTable />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          etiqueta="CapEx Programado del Año"
          icono={DollarSign}
          valor={formatMoneda(capexAutorizadoTotal(), moneda)}
          detalle={`de ${formatMoneda(CAPEX_BOLSA_ANUAL_USD, moneda)} autorizados`}
        />
        <KpiCard
          etiqueta="Certificaciones LEED & ESG"
          icono={Award}
          valor={`${certificacionesLEEDCount()} naves`}
          detalle={`de ${totalNaves()} activos del portafolio`}
        />
        <KpiCard
          etiqueta="Cumplimiento Regulatorio STPS"
          icono={ShieldCheck}
          valor={formatPct(cumplimientoSTPSPromedio())}
          detalle="Promedio de cumplimiento NOM vigente"
        />
      </div>

      <AltaInmuebleDialog open={altaAbierta} onOpenChange={setAltaAbierta} />
    </div>
  )
}
