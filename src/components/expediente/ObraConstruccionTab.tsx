import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { documentosPorNave, estudiosPorNave, propietarioPorNave, contratistas, type Nave } from '@/data'
import { formatFecha } from '@/lib/dates'
import { FileDown, FileText, Landmark } from 'lucide-react'

const OBRA_TIPOS = ['Licencia de Construcción', 'Manifestación de Impacto Ambiental', 'Dictamen de Protección Civil', 'Memoria de Cálculo Estructural']

const PLANOS = [
  { nombre: 'Planos de Cimentación', formato: 'DWG' },
  { nombre: 'Red Contra Incendio (RCI)', formato: 'PDF' },
  { nombre: 'Cortes y Fachadas', formato: 'PDF' },
  { nombre: 'Modelo As-Built Coordinado', formato: 'BIM' },
]

export function ObraConstruccionTab({ nave }: { nave: Nave }) {
  const contratistaObra = contratistas[nave.id.charCodeAt(nave.id.length - 1) % 2 === 0 ? 7 : 9]
  const inversionCapExEjecutada = Math.round(nave.superficieConstruccion * 620)
  const permisos = documentosPorNave(nave.id).filter((d) => OBRA_TIPOS.includes(d.tipo))
  const estudios = estudiosPorNave(nave.id)
  const propietario = propietarioPorNave(nave.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Licitación / Contratista Principal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-sm">
            <Fila etiqueta="Razón Social" valor={contratistaObra.nombre} />
            <Fila etiqueta="Esquema de Contratación" valor="Llave en Mano (EPC)" />
            <Fila etiqueta="Cédula de Obra" valor={`CO-${nave.folio}`} />
            <Fila etiqueta="Inversión CapEx Ejecutada" valor={`$${inversionCapExEjecutada.toLocaleString('es-MX')} USD`} tabular />
            <Fila etiqueta="Fecha de Acta Entrega-Recepción" valor={formatFecha(nave.fechaEntrega)} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-muted-foreground">Estatus del Acta</span>
              <StatusBadge estatus="Aprobado" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Especificaciones Estructurales & de Ingeniería</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 text-sm">
            <Fila etiqueta="Altura Libre" valor={`${nave.alturaLibre} m`} tabular />
            <Fila etiqueta="Piso Industrial (FF/FL)" valor={nave.pisoFFFL} tabular />
            <Fila etiqueta="Bahía de Columnas" valor={nave.bahiaColumnas} tabular />
            <Fila etiqueta="Andenes / Rampas" valor={`${nave.numeroAndenes} andenes / ${nave.numeroRampas} rampas`} tabular />
            <Fila etiqueta="Capacidad Eléctrica" valor={`${nave.capacidadElectrica} KVA`} tabular />
            <Fila etiqueta="Sistema Constructivo" valor={nave.sistemaConstructivo} />
            <Fila etiqueta="Iluminación" valor={nave.tipoIluminacion} />
            <Fila etiqueta="Cajones de Estacionamiento" valor={`${nave.numeroCajonesEstacionamiento}`} tabular />
            <Fila etiqueta="Uso de Suelo" valor={nave.usoDeSuelo} />
            <Fila etiqueta="Norma Técnica de Referencia" valor="ACI 302.1R / NMX-C-406-ONNCCE" />
          </CardContent>
        </Card>
      </div>

      {propietario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4 text-brand-cobalt" />
              Datos Legales del Propietario
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            <Fila etiqueta="Propietario" valor={propietario.razonSocial} />
            <Fila etiqueta="RFC" valor={propietario.rfc} tabular />
            <Fila etiqueta="Régimen de Propiedad" valor={propietario.regimenPropiedad} />
            <Fila etiqueta="Número de Escritura" valor={propietario.numeroEscritura} tabular />
            <Fila etiqueta="Notario" valor={propietario.notario} />
            <Fila etiqueta="Folio RPP" valor={propietario.folioRPP} tabular />
            <div className="sm:col-span-2">
              <Fila
                etiqueta="Gravámenes"
                valor={propietario.gravamenes ?? 'Libre de gravamen'}
                tabular={false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Permisos Oficiales, Licencias y Dictámenes de Obra</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento / Trámite</TableHead>
                  <TableHead>Dependencia Emisora</TableHead>
                  <TableHead>No. de Expediente / Folio</TableHead>
                  <TableHead>Fecha de Emisión</TableHead>
                  <TableHead>Estatus Jurídico</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permisos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium text-foreground">{doc.tipo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{doc.dependenciaEmisora}</TableCell>
                    <TableCell className="tabular text-xs">{doc.numeroFolio}</TableCell>
                    <TableCell className="tabular text-xs">{formatFecha(doc.fechaEmision)}</TableCell>
                    <TableCell>
                      <StatusBadge estatus={doc.estatusJuridico} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Ver PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Estudios Técnicos de Due Diligence</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudio</TableHead>
                  <TableHead>Empresa Consultora</TableHead>
                  <TableHead>Fecha de Realización</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudios.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-foreground">{e.tipo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.empresaConsultora}</TableCell>
                    <TableCell className="tabular text-xs">{formatFecha(e.fechaRealizacion)}</TableCell>
                    <TableCell className="max-w-[260px] text-xs text-muted-foreground">{e.resultado}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Ver PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Planos Arquitectónicos & As-Built</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLANOS.map((p) => (
            <div key={p.nombre} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-cobalt/10 text-brand-cobalt">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{p.nombre}</div>
                <div className="text-[11px] font-semibold text-muted-foreground">{p.formato}</div>
              </div>
              <FileDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
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
