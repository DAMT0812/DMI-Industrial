import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AprobarRechazarDialog } from '@/components/shared/AprobarRechazarDialog'
import {
  inquilinoPorNaveId,
  inquilinoById,
  parqueById,
  PM_POR_REGION,
  FACILITY_MANAGER_POR_REGION,
  brokerPorNaveId,
  brokerById,
  contactosEmergenciaPorNave,
  type Nave,
} from '@/data'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { formatMoneda } from '@/lib/format'
import { formatFecha } from '@/lib/dates'
import { Mail, Phone, ShieldAlert, Users } from 'lucide-react'

export function ContratoArrendatarioTab({ nave }: { nave: Nave }) {
  const { moneda } = usePreferences()
  const { contratoPorNaveId, editarContrato } = useDataStore()
  const contrato = contratoPorNaveId(nave.id)
  const inquilino = inquilinoById(inquilinoPorNaveId[nave.id] ?? '')
  const region = parqueById(nave.parqueId)!.region
  const pm = PM_POR_REGION[region]
  const fm = FACILITY_MANAGER_POR_REGION[region]
  const broker = brokerById(brokerPorNaveId[nave.id])
  const emergencia = contactosEmergenciaPorNave(nave.id)

  // Interacción ligera de la maqueta (sin persistir entre sesiones): Dirección
  // aprueba o rechaza la renovación vía DataStoreContext; un rechazo regresa
  // el contrato a "En Revisión" para continuar la negociación, nunca queda en
  // "Rechazado". El cambio se refleja en cualquier otra pantalla que lea este
  // mismo contrato (Directorio, alertas de vencimiento, etc.).
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const estatusMostrado = contrato?.estatus

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {contrato && inquilino ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Contrato de Arrendamiento</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 text-sm">
                <Fila etiqueta="Arrendatario" valor={inquilino.razonSocial} />
                <Fila etiqueta="Tipo de Contrato" valor={contrato.tipoContrato} />
                <Fila etiqueta="Fecha de Inicio" valor={formatFecha(contrato.fechaInicio)} />
                <Fila etiqueta="Fecha de Vencimiento" valor={formatFecha(contrato.fechaVencimiento)} />
                <Fila etiqueta="Plazo Forzoso" valor={`${contrato.plazoMeses} meses`} tabular />
                <Fila etiqueta="Renta Base Mensual" valor={formatMoneda(contrato.rentaBaseMensual, moneda)} tabular />
                <Fila etiqueta="CAM Mensual" valor={formatMoneda(contrato.cam, moneda)} tabular />
                <Fila etiqueta="Depósito en Garantía" valor={formatMoneda(contrato.depositoGarantia, moneda)} tabular />
                <Fila etiqueta="Esquema de Incremento" valor={contrato.esquemaIncremento} />
                <Fila etiqueta="Opciones de Renovación" valor={contrato.opcionesRenovacion} />
                <Fila etiqueta="Avalista" valor={contrato.avalista} />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-muted-foreground">Estatus</span>
                  <StatusBadge estatus={estatusMostrado!} />
                </div>
                {estatusMostrado === 'En Revisión' && (
                  <div className="flex justify-end pt-1">
                    <Button size="sm" className="h-7 text-xs" onClick={() => setDialogoAbierto(true)}>
                      Resolver Renovación
                    </Button>
                  </div>
                )}
                {contrato.clausulasEspeciales.length > 0 && (
                  <div className="mt-1 rounded-md bg-surface-secondary p-3">
                    <div className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">Cláusulas Especiales</div>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-foreground">
                      {contrato.clausulasEspeciales.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Datos del Inquilino</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <div>
                  <div className="text-base font-semibold text-primary">{inquilino.nombreComercial}</div>
                  <div className="text-xs text-muted-foreground">{inquilino.industria}</div>
                </div>
                <ContactoBlock titulo="Representante Legal" contacto={inquilino.representanteLegal} />
                <ContactoBlock titulo="Plant Manager" contacto={inquilino.plantManager} />
                <ContactoBlock titulo="Contacto de Mantenimiento" contacto={inquilino.contactoMantenimiento} />
                <ContactoBlock titulo="Cuentas por Pagar" contacto={inquilino.contactoCxP} />
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="lg:col-span-2">
            <p className="text-sm text-muted-foreground italic">Esta nave se encuentra disponible — sin contrato de arrendamiento vigente.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-brand-cobalt" />
              Contactos Clave del Inmueble
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-sm">
            <Fila etiqueta="Property Manager Regional" valor={pm} />
            <Fila etiqueta="Facility Manager Regional" valor={fm} />
            {broker && <Fila etiqueta="Broker Externo" valor={`${broker.nombre} — ${broker.inmobiliaria}`} />}
            {broker && <Fila etiqueta="Contacto del Broker" valor={`${broker.telefono} · ${broker.email}`} tabular />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-status-danger" />
              Proveedores de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-sm">
            {emergencia.map((c) => (
              <Fila key={c.tipo} etiqueta={c.tipo} valor={`${c.nombre} · ${c.telefono}`} tabular />
            ))}
          </CardContent>
        </Card>
      </div>

      {contrato && (
        <AprobarRechazarDialog
          open={dialogoAbierto}
          onOpenChange={setDialogoAbierto}
          titulo="Resolver Renovación de Contrato"
          descripcion={`${inquilino?.nombreComercial} — vence ${formatFecha(contrato.fechaVencimiento)}`}
          etiquetaAprobar="Aprobar Renovación"
          etiquetaRechazar="Rechazar Términos"
          onAprobar={() => editarContrato(contrato.id, { estatus: 'Vigente' })}
          onRechazar={() => editarContrato(contrato.id, { estatus: 'En Revisión' })}
        />
      )}
    </div>
  )
}

function Fila({ etiqueta, valor, tabular }: { etiqueta: string; valor: string; tabular?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{etiqueta}</span>
      <span className={`text-right text-sm text-foreground ${tabular ? 'tabular' : ''}`}>{valor}</span>
    </div>
  )
}

function ContactoBlock({ titulo, contacto }: { titulo: string; contacto: { nombre: string; puesto: string; email: string; telefono: string } }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase">{titulo}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{contacto.nombre}</div>
      <div className="text-xs text-muted-foreground">{contacto.puesto}</div>
      <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Mail className="h-3 w-3" /> {contacto.email}
        </span>
        <span className="tabular flex items-center gap-1.5">
          <Phone className="h-3 w-3" /> {contacto.telefono}
        </span>
      </div>
    </div>
  )
}
