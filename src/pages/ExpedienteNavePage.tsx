import { Link, Navigate, useParams } from 'react-router-dom'
import { Download, Lock, MapPin, Share2, ShieldCheck, ClipboardPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ObraConstruccionTab } from '@/components/expediente/ObraConstruccionTab'
import { ContratoArrendatarioTab } from '@/components/expediente/ContratoArrendatarioTab'
import { EquiposMantenimientoTab } from '@/components/expediente/EquiposMantenimientoTab'
import { PredialCfeServiciosTab } from '@/components/expediente/PredialCfeServiciosTab'
import { MultimediaTab } from '@/components/expediente/MultimediaTab'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { parqueById, inquilinoPorNaveId, inquilinoById } from '@/data'
import { formatMoneda, formatSuperficie } from '@/lib/format'
import { mesesRestantes } from '@/lib/dates'

export function ExpedienteNavePage() {
  const { naveId } = useParams()
  const { moneda, unidad, perfilSimulado } = usePreferences()
  const { naveById, contratoPorNaveId } = useDataStore()
  const nave = naveId ? naveById(naveId) : undefined

  if (!nave) return <Navigate to="/" replace />

  const parque = parqueById(nave.parqueId)!
  const contrato = contratoPorNaveId(nave.id)
  const inquilino = inquilinoById(inquilinoPorNaveId[nave.id] ?? '')
  const mesesRestantesContrato = contrato ? mesesRestantes(contrato.fechaVencimiento) : null

  const fueraDeRegion = perfilSimulado.region !== 'todas' && parque.region !== perfilSimulado.region
  const esContabilidad = perfilSimulado.rol === 'Contabilidad'

  if (fueraDeRegion) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-20 text-center">
        <Lock className="h-8 w-8 text-status-danger" />
        <h2 className="text-headline-sm text-foreground">Sin acceso a esta nave</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {parque.nombre} pertenece a la región <strong>{parque.region}</strong>, fuera del alcance de{' '}
          <strong>{perfilSimulado.nombre}</strong> ({perfilSimulado.puesto}). Cambia de perfil simulado en la barra superior o vuelve al portafolio.
        </p>
        <Button size="sm" variant="outline" render={<Link to="/" />} nativeButton={false}>
          Volver al Portafolio
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              Activo Institucional {nave.claseActivo}
            </span>
            <span className="tabular text-xs text-muted-foreground">{nave.folio}</span>
            {nave.certificacionLEED && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-brand-pine/10 px-2 py-0.5 text-[11px] font-semibold text-brand-pine">
                <ShieldCheck className="h-3 w-3" /> Certificado {nave.certificacionLEED}
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-headline-lg-mobile sm:text-headline-lg text-primary">
            {parque.nombre} — Nave {nave.numeroNave}
          </h1>
          <p className="text-sm text-muted-foreground">{parque.corredorIndustrial}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {nave.direccion} · {nave.coordenadas.lat.toFixed(4)}, {nave.coordenadas.lng.toFixed(4)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            Descargar Dossier (ZIP)
          </Button>
          <Button variant="outline" className="gap-1.5">
            <Share2 className="h-4 w-4" />
            Compartir Acceso Seguro
          </Button>
          <Button className="gap-1.5">
            <ClipboardPlus className="h-4 w-4" />
            Nueva Bitácora / Auditoría
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-label-md uppercase text-muted-foreground">Superficie Terreno & GLA</div>
          <div className="tabular mt-1.5 text-headline-md font-bold text-primary">{formatSuperficie(nave.gla, unidad)}</div>
          <div className="tabular text-xs text-muted-foreground">Terreno {formatSuperficie(nave.superficieTerreno, unidad)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-label-md uppercase text-muted-foreground">Inquilino Corporativo</div>
          <div className="mt-1.5 truncate text-lg font-bold text-primary">{inquilino ? inquilino.nombreComercial : 'Disponible'}</div>
          {contrato && (
            <div className="mt-1">
              <StatusBadge estatus={contrato.tipoContrato} />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-label-md uppercase text-muted-foreground">Renta Base Contractual</div>
          {contrato ? (
            <>
              <div className="tabular mt-1.5 text-headline-md font-bold text-primary">{formatMoneda(contrato.rentaBaseMensual, moneda)}</div>
              <div className="tabular text-xs text-muted-foreground">${contrato.tarifaPorM2.toFixed(2)} USD/m² · mensual</div>
            </>
          ) : (
            <div className="mt-1.5 text-sm text-muted-foreground italic">Sin contrato vigente</div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-label-md uppercase text-muted-foreground">Vigencia de Arrendamiento</div>
          {contrato ? (
            <>
              <div className="tabular mt-1.5 text-headline-md font-bold text-primary">{mesesRestantesContrato} meses</div>
              <StatusBadge estatus={nave.estatusOperativo} className="mt-1" />
            </>
          ) : (
            <div className="mt-1.5 text-sm text-muted-foreground italic">—</div>
          )}
        </div>
      </div>

      {esContabilidad && (
        <div className="flex items-center gap-2 rounded-md border border-status-warning-bg bg-status-warning-bg/60 px-3 py-2 text-xs text-status-warning">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Perfil Contabilidad: solo tienes acceso a "Predial, CFE & Servicios". El resto del expediente técnico y legal está restringido.
        </div>
      )}

      {nave.id.startsWith('NAVE-NEW') && (
        <div className="flex items-center gap-2 rounded-md border border-status-warning-bg bg-status-warning-bg/60 px-3 py-2 text-xs text-status-warning">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Expediente Incompleto: esta nave se dio de alta en esta sesión y aún no tiene documentos, contrato ni sistemas críticos cargados.
        </div>
      )}

      <Tabs defaultValue={esContabilidad ? 'predial' : 'obra'}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="obra">Obra & Construcción</TabsTrigger>
          <TabsTrigger value="contrato">Contrato & Arrendatario</TabsTrigger>
          <TabsTrigger value="equipos">Equipos & Mantenimiento</TabsTrigger>
          <TabsTrigger value="predial">Predial, CFE & Servicios</TabsTrigger>
          <TabsTrigger value="multimedia">Multimedia 360° & Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="obra" className="mt-5">
          {esContabilidad ? <AccesoRestringido /> : <ObraConstruccionTab nave={nave} />}
        </TabsContent>
        <TabsContent value="contrato" className="mt-5">
          {esContabilidad ? <AccesoRestringido /> : <ContratoArrendatarioTab nave={nave} />}
        </TabsContent>
        <TabsContent value="equipos" className="mt-5">
          {esContabilidad ? <AccesoRestringido /> : <EquiposMantenimientoTab nave={nave} />}
        </TabsContent>
        <TabsContent value="predial" className="mt-5">
          <PredialCfeServiciosTab nave={nave} />
        </TabsContent>
        <TabsContent value="multimedia" className="mt-5">
          {esContabilidad ? <AccesoRestringido /> : <MultimediaTab nave={nave} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AccesoRestringido() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-secondary py-14 text-center">
      <Lock className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Esta sección no está disponible para el rol Contabilidad. Cambia a Property Manager o Dirección para consultarla.
      </p>
    </div>
  )
}
