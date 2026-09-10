import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDataStore } from '@/context/DataStoreContext'
import { parques, type Nave, type EstatusOperativo } from '@/data'

const TIPOS_PROPIEDAD: Nave['tipoPropiedad'][] = ['Nave Industrial', 'Bodega Logística', 'Terreno', 'Nave BTS']
const CLASES_ACTIVO: Nave['claseActivo'][] = ['Clase A', 'Clase B']
const ESTATUS_OPERATIVOS: EstatusOperativo[] = ['Óptimo Operativo', 'Alerta Predial Pendiente', 'En Renovación Formal', 'Mant. Preventivo HVAC', 'En Mora']
const CERTIFICACIONES_LEED = ['Ninguna', 'LEED Silver', 'LEED Gold', 'LEED Platinum'] as const

interface FormState {
  folio: string
  parqueId: string
  numeroNave: string
  direccion: string
  lat: string
  lng: string
  tipoPropiedad: Nave['tipoPropiedad']
  claseActivo: Nave['claseActivo']
  superficieTerreno: string
  superficieConstruccion: string
  gla: string
  areaOficinas: string
  alturaLibre: string
  pisoFFFL: string
  numeroAndenes: string
  numeroRampas: string
  capacidadElectrica: string
  certificacionLEED: (typeof CERTIFICACIONES_LEED)[number]
  certificacionESG: boolean
  cumplimientoSTPS: string
  estatusOperativo: EstatusOperativo
}

const ESTADO_INICIAL: FormState = {
  folio: '',
  parqueId: '',
  numeroNave: '',
  direccion: '',
  lat: '',
  lng: '',
  tipoPropiedad: 'Nave Industrial',
  claseActivo: 'Clase A',
  superficieTerreno: '',
  superficieConstruccion: '',
  gla: '',
  areaOficinas: '',
  alturaLibre: '',
  pisoFFFL: '',
  numeroAndenes: '',
  numeroRampas: '',
  capacidadElectrica: '',
  certificacionLEED: 'Ninguna',
  certificacionESG: false,
  cumplimientoSTPS: '',
  estatusOperativo: 'Óptimo Operativo',
}

const CAMPOS_OBLIGATORIOS: (keyof FormState)[] = [
  'folio',
  'parqueId',
  'numeroNave',
  'direccion',
  'lat',
  'lng',
  'superficieTerreno',
  'superficieConstruccion',
  'gla',
  'areaOficinas',
  'alturaLibre',
  'pisoFFFL',
  'numeroAndenes',
  'numeroRampas',
  'capacidadElectrica',
  'cumplimientoSTPS',
]

export function AltaInmuebleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { naves, agregarNave } = useDataStore()
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL)
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const [confirmado, setConfirmado] = useState<string | null>(null)

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const faltantes = CAMPOS_OBLIGATORIOS.filter((c) => !String(form[c]).trim())
  const folioDuplicado = form.folio.trim() !== '' && naves.some((n) => n.folio.toLowerCase() === form.folio.trim().toLowerCase())
  const esValido = faltantes.length === 0 && !folioDuplicado

  function limpiarYCerrar(open: boolean) {
    if (!open) {
      setForm(ESTADO_INICIAL)
      setIntentoEnviar(false)
      setConfirmado(null)
    }
    onOpenChange(open)
  }

  function enviar() {
    setIntentoEnviar(true)
    if (!esValido) return

    const nave: Nave = {
      id: `NAVE-NEW-${Date.now()}`,
      folio: form.folio.trim(),
      parqueId: form.parqueId,
      numeroNave: form.numeroNave.trim(),
      direccion: form.direccion.trim(),
      coordenadas: { lat: Number(form.lat), lng: Number(form.lng) },
      tipoPropiedad: form.tipoPropiedad,
      claseActivo: form.claseActivo,
      estatusOperativo: form.estatusOperativo,
      superficieTerreno: Number(form.superficieTerreno),
      superficieConstruccion: Number(form.superficieConstruccion),
      gla: Number(form.gla),
      areaOficinas: Number(form.areaOficinas),
      alturaLibre: Number(form.alturaLibre),
      numeroAndenes: Number(form.numeroAndenes),
      numeroRampas: Number(form.numeroRampas),
      capacidadElectrica: Number(form.capacidadElectrica),
      pisoFFFL: form.pisoFFFL.trim(),
      bahiaColumnas: '12m x 24m',
      usoDeSuelo: form.tipoPropiedad === 'Bodega Logística' ? 'I-1 Industria Ligera y de Riesgo Bajo (Uso Logístico)' : 'I-2 Industria Mediana e Intensiva',
      sistemaConstructivo:
        form.claseActivo === 'Clase A'
          ? 'Estructura metálica prefabricada, muros de block y panel aislante, cubierta tipo sándwich'
          : 'Estructura metálica, muros de block, cubierta galvanizada',
      numeroCajonesEstacionamiento: Math.round(Number(form.gla) / 180) + Math.round(Number(form.areaOficinas) / 20),
      tipoIluminacion: 'LED de alta eficiencia en nave y oficinas',
      certificacionLEED: form.certificacionLEED === 'Ninguna' ? null : form.certificacionLEED,
      certificacionESG: form.certificacionESG,
      cumplimientoSTPS: Number(form.cumplimientoSTPS),
      ocupada: false,
      fechaEntrega: new Date().toISOString().slice(0, 10),
    }

    agregarNave(nave)
    setConfirmado(nave.folio)
  }

  return (
    <Dialog open={open} onOpenChange={limpiarYCerrar}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alta de Inmueble</DialogTitle>
          <DialogDescription>
            Registra un nuevo inmueble en el portafolio. Los campos marcados con * son obligatorios; el expediente queda "Incompleto" hasta cargar la documentación.
          </DialogDescription>
        </DialogHeader>

        {confirmado ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">Nave {confirmado} agregada al Directorio del Portafolio.</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Se agregó a la tabla de esta sesión (sin persistencia real). Los KPIs agregados del portafolio no se recalculan automáticamente — es una limitación conocida de esta maqueta.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Folio *" error={intentoEnviar && (!form.folio.trim() || folioDuplicado)} mensajeError={folioDuplicado ? 'Ese folio ya existe' : undefined}>
              <Input value={form.folio} onChange={(e) => set('folio', e.target.value)} placeholder="DMI-JAL-XXX-N01" />
            </Campo>
            <Campo label="Parque Industrial *" error={intentoEnviar && !form.parqueId}>
              <select
                value={form.parqueId}
                onChange={(e) => set('parqueId', e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                <option value="">Selecciona…</option>
                {parques.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Número de Nave *" error={intentoEnviar && !form.numeroNave.trim()}>
              <Input value={form.numeroNave} onChange={(e) => set('numeroNave', e.target.value)} placeholder="05" />
            </Campo>
            <Campo label="Tipo de Propiedad *">
              <select
                value={form.tipoPropiedad}
                onChange={(e) => set('tipoPropiedad', e.target.value as Nave['tipoPropiedad'])}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                {TIPOS_PROPIEDAD.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Dirección *" full error={intentoEnviar && !form.direccion.trim()}>
              <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle, número, colonia, ciudad, C.P." />
            </Campo>
            <Campo label="Latitud *" error={intentoEnviar && !form.lat.trim()}>
              <Input value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="20.5236" inputMode="decimal" />
            </Campo>
            <Campo label="Longitud *" error={intentoEnviar && !form.lng.trim()}>
              <Input value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="-103.1922" inputMode="decimal" />
            </Campo>
            <Campo label="Clase de Activo *">
              <select
                value={form.claseActivo}
                onChange={(e) => set('claseActivo', e.target.value as Nave['claseActivo'])}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                {CLASES_ACTIVO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Estatus Operativo *">
              <select
                value={form.estatusOperativo}
                onChange={(e) => set('estatusOperativo', e.target.value as EstatusOperativo)}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                {ESTATUS_OPERATIVOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Superficie Terreno (m²) *" error={intentoEnviar && !form.superficieTerreno.trim()}>
              <Input value={form.superficieTerreno} onChange={(e) => set('superficieTerreno', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Superficie Construcción (m²) *" error={intentoEnviar && !form.superficieConstruccion.trim()}>
              <Input value={form.superficieConstruccion} onChange={(e) => set('superficieConstruccion', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="GLA (m²) *" error={intentoEnviar && !form.gla.trim()}>
              <Input value={form.gla} onChange={(e) => set('gla', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Área de Oficinas (m²) *" error={intentoEnviar && !form.areaOficinas.trim()}>
              <Input value={form.areaOficinas} onChange={(e) => set('areaOficinas', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Altura Libre (m) *" error={intentoEnviar && !form.alturaLibre.trim()}>
              <Input value={form.alturaLibre} onChange={(e) => set('alturaLibre', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Piso FF/FL *" error={intentoEnviar && !form.pisoFFFL.trim()}>
              <Input value={form.pisoFFFL} onChange={(e) => set('pisoFFFL', e.target.value)} placeholder="FF 50 / FL 75" />
            </Campo>
            <Campo label="Número de Andenes *" error={intentoEnviar && !form.numeroAndenes.trim()}>
              <Input value={form.numeroAndenes} onChange={(e) => set('numeroAndenes', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Número de Rampas *" error={intentoEnviar && !form.numeroRampas.trim()}>
              <Input value={form.numeroRampas} onChange={(e) => set('numeroRampas', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Capacidad Eléctrica (KVA) *" error={intentoEnviar && !form.capacidadElectrica.trim()}>
              <Input value={form.capacidadElectrica} onChange={(e) => set('capacidadElectrica', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Cumplimiento STPS (%) *" error={intentoEnviar && !form.cumplimientoSTPS.trim()}>
              <Input value={form.cumplimientoSTPS} onChange={(e) => set('cumplimientoSTPS', e.target.value)} inputMode="numeric" />
            </Campo>
            <Campo label="Certificación LEED *">
              <select
                value={form.certificacionLEED}
                onChange={(e) => set('certificacionLEED', e.target.value as FormState['certificacionLEED'])}
                className="h-9 w-full rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                {CERTIFICACIONES_LEED.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.certificacionESG} onChange={(e) => set('certificacionESG', e.target.checked)} className="h-4 w-4" />
                Certificación ESG *
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {confirmado ? (
            <Button onClick={() => limpiarYCerrar(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => limpiarYCerrar(false)}>
                Cancelar
              </Button>
              <Button onClick={enviar}>Dar de Alta</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Campo({
  label,
  children,
  full,
  error,
  mensajeError,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
  error?: boolean
  mensajeError?: string
}) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="mt-1 text-[11px] text-status-danger">{mensajeError ?? 'Este campo es obligatorio'}</p>}
    </div>
  )
}
