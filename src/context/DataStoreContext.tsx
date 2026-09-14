import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  ContratoArrendamiento,
  CotizacionCapex,
  DocumentoPermiso,
  EstadoRenovacion,
  EvidenciaOrden,
  Nave,
  OrdenTrabajo,
  PausaOrden,
  ProyectoCapex,
  RenovacionContrato,
  SentidoVoto,
  TareaOperativa,
  VotoCapex,
} from '@/data/types'
import { supabase } from '@/lib/supabaseClient'
import { registrarBitacora } from '@/lib/bitacora'
import { useAuth } from '@/context/AuthContext'
import { documentosPorNave as documentosPorNaveBase } from '@/data/documentos'
import {
  proyectoCapexPorNave as proyectoCapexPorNaveBase,
  capexAutorizadoTotal as capexAutorizadoTotalBase,
  capexDisponiblePct as capexDisponiblePctBase,
} from '@/data/proyectosCapex'
import { calcularAlertas, requerimientosCriticos as requerimientosCriticosBase, vencimientosContrato90Dias as vencimientosContrato90DiasBase } from '@/data/alertas'
import { calcularTareasVivas } from '@/data/tareasVivas'
import * as portafolioKpis from '@/data/portafolioKpis'
import * as mantenimientoKpis from '@/data/mantenimientoKpis'

// naves, documentos y contratos/renovaciones (Fases 6f/6d/6g) persisten de verdad en
// Supabase. El resto de entidades editables sigue como arreglo base (src/data/*.ts, sin
// tocar) + un mapa de overrides de sesión que se fusiona aquí, hasta que les toque su
// propia fase de migración. Todo lo derivado (alertas, tareas vivas, KPIs de portafolio
// y mantenimiento) se recalcula de forma reactiva a partir de esos datos ya fusionados,
// así una edición se refleja automáticamente en cualquier pantalla que consuma estos
// mismos hooks.
interface DataStoreContextValue {
  naves: Nave[]
  // false hasta que se resuelve el primer fetch a Supabase — úsalo para no tratar una
  // nave "todavía no cargada" como "no existe" (p. ej. al refrescar /naves/:id de golpe).
  navesListas: boolean
  naveById: (id: string) => Nave | undefined
  agregarNave: (nave: Nave) => void
  editarNave: (id: string, cambios: Partial<Nave>) => void

  documentos: DocumentoPermiso[]
  documentosPorNave: (naveId: string) => DocumentoPermiso[]
  editarDocumento: (id: string, cambios: Partial<DocumentoPermiso>) => void

  contratos: ContratoArrendamiento[]
  contratoPorNaveId: (naveId: string) => ContratoArrendamiento | undefined
  editarContrato: (id: string, cambios: Partial<ContratoArrendamiento>) => void
  renovaciones: RenovacionContrato[]
  renovacionActivaPorContrato: (contratoId: string) => RenovacionContrato | undefined
  resolverRenovacion: (contratoId: string, decision: 'aprobar' | 'rechazar', motivo?: string) => void

  ordenesTrabajo: OrdenTrabajo[]
  ordenesPorNave: (naveId: string) => OrdenTrabajo[]
  editarOrden: (id: string, cambios: Partial<OrdenTrabajo>) => void
  pausaAbiertaPorOrden: (ordenId: string) => PausaOrden | undefined
  pausarOrden: (ordenId: string, motivo: string) => void
  reanudarOrden: (ordenId: string) => void
  evidenciaPendientePorOrden: (ordenId: string) => EvidenciaOrden | undefined
  enviarEvidencia: (ordenId: string, archivo: File) => void
  resolverEvidenciaCierre: (ordenId: string, decision: 'aprobar' | 'rechazar', motivo?: string) => void

  tareasOperativas: TareaOperativa[]
  editarTarea: (id: string, cambios: Partial<TareaOperativa>) => void

  proyectosCapex: ProyectoCapex[]
  proyectoCapexPorNave: (naveId: string) => ProyectoCapex[]
  agregarProyectoCapex: (proyecto: Pick<ProyectoCapex, 'naveId' | 'titulo' | 'justificacionTecnica' | 'inversionEstimada' | 'roiProyectadoPct' | 'paybackAnios'>) => void
  editarCapex: (id: string, cambios: Partial<ProyectoCapex>) => void
  capexAutorizadoTotal: number
  capexDisponiblePct: number

  capexCotizaciones: CotizacionCapex[]
  cotizacionesPorProyecto: (proyectoId: string) => CotizacionCapex[]
  registrarCotizacionCapex: (proyectoId: string, cotizacion: { proveedor: string; monto: number; garantiaMeses: number }) => void
  enviarCapexAComite: (proyectoId: string) => void

  capexVotos: VotoCapex[]
  votosPorProyecto: (proyectoId: string) => VotoCapex[]
  miVotoPorProyecto: (proyectoId: string) => VotoCapex | undefined
  votarCapex: (proyectoId: string, sentido: SentidoVoto, comentario?: string) => void
  resolverComiteCapex: (proyectoId: string, decision: 'aprobar' | 'rechazar', motivo?: string) => void

  perfilesPorId: Record<string, string>

  alertas: ReturnType<typeof calcularAlertas>
  tareasVivas: ReturnType<typeof calcularTareasVivas>
  requerimientosCriticos: number
  vencimientosContrato90Dias: number

  totalNaves: number
  navesOcupadas: number
  ocupacionGlobalPct: number
  glaTotal: number
  glaDisponible: number
  ingresoMensualTotalUSD: number
  cobranzaAlDiaPct: number
  certificacionesLEEDCount: number
  cumplimientoSTPSPromedio: number
  desgloseIndustria: ReturnType<typeof portafolioKpis.desgloseIndustria>
  serieNOIAnual: ReturnType<typeof portafolioKpis.serieNOIAnual>

  correctivosActivos: ReturnType<typeof mantenimientoKpis.correctivosActivos>
  capexProyectosMayores: number
  capexAutorizadoAnio: number
  slaPromedioResolucionHoras: number
  proyectoMayorEnCurso: ProyectoCapex | null
}

const DataStoreContext = createContext<DataStoreContextValue | null>(null)

// naves y documentos ya viven en Supabase de verdad (Fases 6d/6f) — el resto de
// entidades sigue como maqueta en memoria (overrides de sesión) hasta que les
// toque su propia fase de migración. Estos mapeos traducen entre las columnas
// snake_case de cada tabla y los tipos camelCase que ya consume toda la UI.
function naveDeFila(fila: Record<string, unknown>): Nave {
  return {
    id: fila.id as string,
    folio: fila.folio as string,
    parqueId: fila.parque_id as string,
    numeroNave: fila.numero_nave as string,
    direccion: fila.direccion as string,
    coordenadas: { lat: Number(fila.lat), lng: Number(fila.lng) },
    tipoPropiedad: fila.tipo_propiedad as Nave['tipoPropiedad'],
    claseActivo: fila.clase_activo as Nave['claseActivo'],
    estatusOperativo: fila.estatus_operativo as Nave['estatusOperativo'],
    superficieTerreno: Number(fila.superficie_terreno),
    superficieConstruccion: Number(fila.superficie_construccion),
    gla: Number(fila.gla),
    areaOficinas: Number(fila.area_oficinas),
    alturaLibre: Number(fila.altura_libre),
    numeroAndenes: Number(fila.numero_andenes),
    numeroRampas: Number(fila.numero_rampas),
    capacidadElectrica: Number(fila.capacidad_electrica),
    pisoFFFL: fila.piso_fffl as string,
    bahiaColumnas: fila.bahia_columnas as string,
    usoDeSuelo: fila.uso_de_suelo as string,
    sistemaConstructivo: fila.sistema_constructivo as string,
    numeroCajonesEstacionamiento: Number(fila.numero_cajones_estacionamiento),
    tipoIluminacion: fila.tipo_iluminacion as string,
    certificacionLEED: (fila.certificacion_leed as Nave['certificacionLEED']) ?? null,
    certificacionESG: Boolean(fila.certificacion_esg),
    cumplimientoSTPS: Number(fila.cumplimiento_stps),
    ocupada: Boolean(fila.ocupada),
    fechaEntrega: fila.fecha_entrega as string,
  }
}

function describirCambiosNave(cambios: Partial<Nave>): string {
  const partes: string[] = []
  if (cambios.folio !== undefined) partes.push(`folio → ${cambios.folio}`)
  if (cambios.estatusOperativo !== undefined) partes.push(`estatus operativo → ${cambios.estatusOperativo}`)
  if (cambios.claseActivo !== undefined) partes.push(`clase de activo → ${cambios.claseActivo}`)
  if (cambios.direccion !== undefined) partes.push('dirección actualizada')
  if (cambios.certificacionLEED !== undefined) partes.push(`certificación LEED → ${cambios.certificacionLEED ?? 'ninguna'}`)
  if (
    cambios.gla !== undefined ||
    cambios.superficieTerreno !== undefined ||
    cambios.superficieConstruccion !== undefined ||
    cambios.areaOficinas !== undefined ||
    cambios.alturaLibre !== undefined
  ) {
    partes.push('ficha técnica de superficie actualizada')
  }
  return partes.length ? `Inmueble actualizado: ${partes.join(', ')}` : 'Ficha técnica actualizada'
}

function naveAFila(cambios: Partial<Nave>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.folio !== undefined) fila.folio = cambios.folio
  if (cambios.parqueId !== undefined) fila.parque_id = cambios.parqueId
  if (cambios.numeroNave !== undefined) fila.numero_nave = cambios.numeroNave
  if (cambios.direccion !== undefined) fila.direccion = cambios.direccion
  if (cambios.coordenadas !== undefined) {
    fila.lat = cambios.coordenadas.lat
    fila.lng = cambios.coordenadas.lng
  }
  if (cambios.tipoPropiedad !== undefined) fila.tipo_propiedad = cambios.tipoPropiedad
  if (cambios.claseActivo !== undefined) fila.clase_activo = cambios.claseActivo
  if (cambios.estatusOperativo !== undefined) fila.estatus_operativo = cambios.estatusOperativo
  if (cambios.superficieTerreno !== undefined) fila.superficie_terreno = cambios.superficieTerreno
  if (cambios.superficieConstruccion !== undefined) fila.superficie_construccion = cambios.superficieConstruccion
  if (cambios.gla !== undefined) fila.gla = cambios.gla
  if (cambios.areaOficinas !== undefined) fila.area_oficinas = cambios.areaOficinas
  if (cambios.alturaLibre !== undefined) fila.altura_libre = cambios.alturaLibre
  if (cambios.numeroAndenes !== undefined) fila.numero_andenes = cambios.numeroAndenes
  if (cambios.numeroRampas !== undefined) fila.numero_rampas = cambios.numeroRampas
  if (cambios.capacidadElectrica !== undefined) fila.capacidad_electrica = cambios.capacidadElectrica
  if (cambios.pisoFFFL !== undefined) fila.piso_fffl = cambios.pisoFFFL
  if (cambios.bahiaColumnas !== undefined) fila.bahia_columnas = cambios.bahiaColumnas
  if (cambios.usoDeSuelo !== undefined) fila.uso_de_suelo = cambios.usoDeSuelo
  if (cambios.sistemaConstructivo !== undefined) fila.sistema_constructivo = cambios.sistemaConstructivo
  if (cambios.numeroCajonesEstacionamiento !== undefined) fila.numero_cajones_estacionamiento = cambios.numeroCajonesEstacionamiento
  if (cambios.tipoIluminacion !== undefined) fila.tipo_iluminacion = cambios.tipoIluminacion
  if (cambios.certificacionLEED !== undefined) fila.certificacion_leed = cambios.certificacionLEED
  if (cambios.certificacionESG !== undefined) fila.certificacion_esg = cambios.certificacionESG
  if (cambios.cumplimientoSTPS !== undefined) fila.cumplimiento_stps = cambios.cumplimientoSTPS
  if (cambios.ocupada !== undefined) fila.ocupada = cambios.ocupada
  if (cambios.fechaEntrega !== undefined) fila.fecha_entrega = cambios.fechaEntrega
  return fila
}

// contratos y renovaciones (Fase 6g) también persisten de verdad. El ciclo de vida del
// contrato en sí (contratos.vigencia → ContratoArrendamiento.estatus) es independiente
// del proceso de negociación de una renovación (tabla renovaciones): un contrato
// "en revisión" en la UI es en realidad un contrato Vigente con una renovación abierta.
function contratoDeFila(fila: Record<string, unknown>): ContratoArrendamiento {
  return {
    id: fila.id as string,
    naveId: fila.nave_id as string,
    inquilinoId: fila.inquilino_id as string,
    fechaInicio: fila.fecha_inicio as string,
    fechaEntrega: fila.fecha_entrega as string,
    fechaVencimiento: fila.fecha_vencimiento as string,
    plazoMeses: Number(fila.plazo_meses),
    moneda: fila.moneda as ContratoArrendamiento['moneda'],
    rentaBaseMensual: Number(fila.renta_base_mensual),
    tarifaPorM2: Number(fila.tarifa_por_m2),
    cam: Number(fila.cam),
    depositoGarantia: Number(fila.deposito_garantia),
    esquemaIncremento: fila.esquema_incremento as string,
    opcionesRenovacion: fila.opciones_renovacion as string,
    tipoContrato: fila.tipo_contrato as ContratoArrendamiento['tipoContrato'],
    avalista: fila.avalista as string,
    clausulasEspeciales: (fila.clausulas_especiales as string[] | null) ?? [],
    estatus: fila.vigencia as ContratoArrendamiento['estatus'],
  }
}

function describirCambiosContrato(cambios: Partial<ContratoArrendamiento>): string {
  const partes: string[] = []
  if (cambios.estatus !== undefined) partes.push(`vigencia → ${cambios.estatus}`)
  if (cambios.tipoContrato !== undefined) partes.push(`tipo de contrato → ${cambios.tipoContrato}`)
  if (cambios.fechaVencimiento !== undefined) partes.push('fecha de vencimiento actualizada')
  if (cambios.rentaBaseMensual !== undefined || cambios.tarifaPorM2 !== undefined || cambios.cam !== undefined) {
    partes.push('condiciones económicas actualizadas')
  }
  if (cambios.avalista !== undefined) partes.push('avalista actualizado')
  return partes.length ? `Contrato actualizado: ${partes.join(', ')}` : 'Contrato actualizado'
}

function contratoAFila(cambios: Partial<ContratoArrendamiento>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.fechaInicio !== undefined) fila.fecha_inicio = cambios.fechaInicio
  if (cambios.fechaEntrega !== undefined) fila.fecha_entrega = cambios.fechaEntrega
  if (cambios.fechaVencimiento !== undefined) fila.fecha_vencimiento = cambios.fechaVencimiento
  if (cambios.plazoMeses !== undefined) fila.plazo_meses = cambios.plazoMeses
  if (cambios.moneda !== undefined) fila.moneda = cambios.moneda
  if (cambios.rentaBaseMensual !== undefined) fila.renta_base_mensual = cambios.rentaBaseMensual
  if (cambios.tarifaPorM2 !== undefined) fila.tarifa_por_m2 = cambios.tarifaPorM2
  if (cambios.cam !== undefined) fila.cam = cambios.cam
  if (cambios.depositoGarantia !== undefined) fila.deposito_garantia = cambios.depositoGarantia
  if (cambios.esquemaIncremento !== undefined) fila.esquema_incremento = cambios.esquemaIncremento
  if (cambios.opcionesRenovacion !== undefined) fila.opciones_renovacion = cambios.opcionesRenovacion
  if (cambios.tipoContrato !== undefined) fila.tipo_contrato = cambios.tipoContrato
  if (cambios.avalista !== undefined) fila.avalista = cambios.avalista
  if (cambios.clausulasEspeciales !== undefined) fila.clausulas_especiales = cambios.clausulasEspeciales
  if (cambios.estatus !== undefined) fila.vigencia = cambios.estatus
  return fila
}

function renovacionDeFila(fila: Record<string, unknown>): RenovacionContrato {
  return {
    id: fila.id as string,
    contratoId: fila.contrato_id as string,
    estado: fila.estado as EstadoRenovacion,
    motivoRechazo: (fila.motivo_rechazo as string | null) ?? null,
    motivoNoRenovacion: (fila.motivo_no_renovacion as string | null) ?? null,
    fechaApertura: (fila.fecha_apertura as string | null) ?? null,
  }
}

function renovacionAbierta(renovaciones: RenovacionContrato[], contratoId: string) {
  return renovaciones.find((r) => r.contratoId === contratoId && r.estado !== 'Aprobada' && r.estado !== 'No Renovada')
}

// ordenes_trabajo (Fase 6h) también persiste de verdad, con una máquina de estados real
// respaldada por dos tablas auxiliares que ya existían en el esquema sin usarse:
// ordenes_pausas (ventanas de "Esperando Refacción") y ordenes_evidencia (evidencia de
// cierre que Facility Manager sube y luego valida o rechaza antes de cerrar la orden).
function ordenDeFila(fila: Record<string, unknown>): OrdenTrabajo {
  return {
    id: fila.id as string,
    folio: fila.folio as string,
    naveId: fila.nave_id as string,
    sistemaCriticoId: (fila.sistema_critico_id as string | null) ?? null,
    categoria: fila.categoria as string,
    descripcion: fila.descripcion as string,
    prioridad: fila.prioridad as OrdenTrabajo['prioridad'],
    slaHoras: Number(fila.sla_horas),
    contratistaId: fila.contratista_id as string,
    costoEstimado: Number(fila.costo_estimado),
    estatus: fila.estatus as OrdenTrabajo['estatus'],
    fechaCreacion: fila.fecha_creacion as string,
    fechaCompromiso: fila.fecha_compromiso as string,
    fechaCierre: (fila.fecha_cierre as string | null) ?? null,
    motivoCancelacion: (fila.motivo_cancelacion as string | null) ?? null,
  }
}

function describirCambiosOrden(cambios: Partial<OrdenTrabajo>): string {
  const partes: string[] = []
  if (cambios.estatus !== undefined) partes.push(`estatus → ${cambios.estatus}`)
  if (cambios.prioridad !== undefined) partes.push(`prioridad → ${cambios.prioridad}`)
  if (cambios.contratistaId !== undefined) partes.push('contratista reasignado')
  if (cambios.costoEstimado !== undefined) partes.push('costo estimado actualizado')
  if (cambios.categoria !== undefined || cambios.descripcion !== undefined) partes.push('ficha actualizada')
  if (cambios.motivoCancelacion !== undefined) partes.push(`motivo de cancelación: ${cambios.motivoCancelacion}`)
  return partes.length ? `Orden actualizada: ${partes.join(', ')}` : 'Orden actualizada'
}

function ordenAFila(cambios: Partial<OrdenTrabajo>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.categoria !== undefined) fila.categoria = cambios.categoria
  if (cambios.descripcion !== undefined) fila.descripcion = cambios.descripcion
  if (cambios.prioridad !== undefined) fila.prioridad = cambios.prioridad
  if (cambios.slaHoras !== undefined) fila.sla_horas = cambios.slaHoras
  if (cambios.contratistaId !== undefined) fila.contratista_id = cambios.contratistaId
  if (cambios.costoEstimado !== undefined) fila.costo_estimado = cambios.costoEstimado
  if (cambios.estatus !== undefined) fila.estatus = cambios.estatus
  if (cambios.fechaCierre !== undefined) fila.fecha_cierre = cambios.fechaCierre
  if (cambios.motivoCancelacion !== undefined) fila.motivo_cancelacion = cambios.motivoCancelacion
  return fila
}

function actualizarOrdenEnSupabase(id: string, fila: Record<string, unknown>) {
  return supabase
    .from('ordenes_trabajo')
    .update({ ...fila, updated_at: new Date().toISOString() })
    .eq('id', id)
}

function pausaDeFila(fila: Record<string, unknown>): PausaOrden {
  return {
    id: fila.id as string,
    ordenId: fila.orden_id as string,
    inicio: fila.inicio as string,
    fin: (fila.fin as string | null) ?? null,
    motivo: (fila.motivo as string | null) ?? null,
  }
}

function evidenciaDeFila(fila: Record<string, unknown>): EvidenciaOrden {
  return {
    id: fila.id as string,
    ordenId: fila.orden_id as string,
    archivoPath: (fila.archivo_path as string | null) ?? null,
    fecha: fila.fecha as string,
    resultado: fila.resultado as EvidenciaOrden['resultado'],
    motivoRechazo: (fila.motivo_rechazo as string | null) ?? null,
    retrabajo: (fila.retrabajo as boolean | null) ?? null,
    fechaAprobacion: (fila.fecha_aprobacion as string | null) ?? null,
    comentario: (fila.comentario as string | null) ?? null,
  }
}

// tareas_operativas (Fase 6i) también persiste de verdad — es un simple tablero Kanban,
// sin máquina de estados propia (a diferencia de ordenes_trabajo), así que un solo
// editarTarea genérico basta, igual que editarNave/editarContrato.
function tareaDeFila(fila: Record<string, unknown>): TareaOperativa {
  return {
    id: fila.id as string,
    categoria: fila.categoria as TareaOperativa['categoria'],
    titulo: fila.titulo as string,
    naveId: fila.nave_id as string,
    responsable: fila.responsable as string,
    columna: fila.columna as TareaOperativa['columna'],
    costoEstimado: fila.costo_estimado === null || fila.costo_estimado === undefined ? null : Number(fila.costo_estimado),
    avancePct: fila.avance_pct === null || fila.avance_pct === undefined ? null : Number(fila.avance_pct),
    cotizacionesRecibidas: (fila.cotizaciones_recibidas as string | null) ?? null,
    slaRestanteHoras: fila.sla_restante_horas === null || fila.sla_restante_horas === undefined ? null : Number(fila.sla_restante_horas),
  }
}

function describirCambiosTarea(cambios: Partial<TareaOperativa>): string {
  const partes: string[] = []
  if (cambios.columna !== undefined) partes.push(`columna → ${cambios.columna}`)
  if (cambios.avancePct !== undefined) partes.push(`avance → ${cambios.avancePct}%`)
  if (cambios.responsable !== undefined) partes.push('responsable actualizado')
  if (cambios.costoEstimado !== undefined) partes.push('costo estimado actualizado')
  if (cambios.cotizacionesRecibidas !== undefined) partes.push('cotizaciones recibidas actualizadas')
  return partes.length ? `Tarea actualizada: ${partes.join(', ')}` : 'Tarea actualizada'
}

function tareaAFila(cambios: Partial<TareaOperativa>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.categoria !== undefined) fila.categoria = cambios.categoria
  if (cambios.titulo !== undefined) fila.titulo = cambios.titulo
  if (cambios.naveId !== undefined) fila.nave_id = cambios.naveId
  if (cambios.responsable !== undefined) fila.responsable = cambios.responsable
  if (cambios.columna !== undefined) fila.columna = cambios.columna
  if (cambios.costoEstimado !== undefined) fila.costo_estimado = cambios.costoEstimado
  if (cambios.avancePct !== undefined) fila.avance_pct = cambios.avancePct
  if (cambios.cotizacionesRecibidas !== undefined) fila.cotizaciones_recibidas = cambios.cotizacionesRecibidas
  if (cambios.slaRestanteHoras !== undefined) fila.sla_restante_horas = cambios.slaRestanteHoras
  return fila
}

// proyectos_capex (Fase 6i): comité de CapEx con cotizaciones y votos persistidos en sus
// propias tablas (capex_cotizaciones, capex_votos), activadas aquí igual que
// ordenes_pausas/ordenes_evidencia en Fase 6h — ya existían en el esquema sin usarse.
function capexDeFila(fila: Record<string, unknown>): ProyectoCapex {
  return {
    id: fila.id as string,
    codigo: fila.codigo as string,
    naveId: fila.nave_id as string,
    titulo: fila.titulo as string,
    justificacionTecnica: fila.justificacion_tecnica as string,
    inversionEstimada: Number(fila.inversion_estimada),
    roiProyectadoPct: fila.roi_proyectado_pct === null || fila.roi_proyectado_pct === undefined ? 0 : Number(fila.roi_proyectado_pct),
    paybackAnios: fila.payback_anios === null || fila.payback_anios === undefined ? 0 : Number(fila.payback_anios),
    estatusComite: fila.estatus_comite as ProyectoCapex['estatusComite'],
    motivoRechazo: (fila.motivo_rechazo as string | null) ?? null,
    proveedorSeleccionado: (fila.proveedor_seleccionado as string | null) ?? null,
    avanceFisicoPct: Number(fila.avance_fisico_pct),
    avanceFinancieroPct: Number(fila.avance_financiero_pct),
  }
}

function describirCambiosCapex(cambios: Partial<ProyectoCapex>): string {
  const partes: string[] = []
  if (cambios.estatusComite !== undefined) partes.push(`estatus del comité → ${cambios.estatusComite}`)
  if (cambios.proveedorSeleccionado !== undefined) partes.push(`proveedor seleccionado → ${cambios.proveedorSeleccionado}`)
  if (cambios.avanceFisicoPct !== undefined || cambios.avanceFinancieroPct !== undefined) partes.push('avance de ejecución actualizado')
  if (cambios.motivoRechazo !== undefined && cambios.motivoRechazo !== null) partes.push(`motivo de rechazo: ${cambios.motivoRechazo}`)
  if (cambios.titulo !== undefined || cambios.justificacionTecnica !== undefined || cambios.inversionEstimada !== undefined) {
    partes.push('ficha del proyecto actualizada')
  }
  return partes.length ? `Proyecto CapEx actualizado: ${partes.join(', ')}` : 'Proyecto CapEx actualizado'
}

function capexAFila(cambios: Partial<ProyectoCapex>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.titulo !== undefined) fila.titulo = cambios.titulo
  if (cambios.justificacionTecnica !== undefined) fila.justificacion_tecnica = cambios.justificacionTecnica
  if (cambios.inversionEstimada !== undefined) fila.inversion_estimada = cambios.inversionEstimada
  if (cambios.roiProyectadoPct !== undefined) fila.roi_proyectado_pct = cambios.roiProyectadoPct
  if (cambios.paybackAnios !== undefined) fila.payback_anios = cambios.paybackAnios
  if (cambios.estatusComite !== undefined) fila.estatus_comite = cambios.estatusComite
  if (cambios.motivoRechazo !== undefined) fila.motivo_rechazo = cambios.motivoRechazo
  if (cambios.proveedorSeleccionado !== undefined) fila.proveedor_seleccionado = cambios.proveedorSeleccionado
  if (cambios.avanceFisicoPct !== undefined) fila.avance_fisico_pct = cambios.avanceFisicoPct
  if (cambios.avanceFinancieroPct !== undefined) fila.avance_financiero_pct = cambios.avanceFinancieroPct
  return fila
}

function cotizacionCapexDeFila(fila: Record<string, unknown>): CotizacionCapex {
  return {
    id: fila.id as string,
    proyectoId: fila.proyecto_capex_id as string,
    proveedor: fila.proveedor as string,
    monto: Number(fila.monto),
    garantiaMeses: Number(fila.garantia_meses),
    recibida: Boolean(fila.recibida),
  }
}

function votoCapexDeFila(fila: Record<string, unknown>): VotoCapex {
  return {
    id: fila.id as string,
    proyectoId: fila.proyecto_id as string,
    usuarioId: (fila.usuario_id as string | null) ?? null,
    sentido: fila.sentido as SentidoVoto,
    comentario: (fila.comentario as string | null) ?? null,
    fecha: fila.fecha as string,
  }
}

function documentoDeFila(fila: Record<string, unknown>): DocumentoPermiso {
  return {
    id: fila.id as string,
    naveId: fila.nave_id as string,
    tipo: fila.tipo as DocumentoPermiso['tipo'],
    dependenciaEmisora: fila.dependencia_emisora as string,
    numeroFolio: fila.numero_folio as string,
    fechaEmision: fila.fecha_emision as string,
    fechaVencimiento: fila.fecha_vencimiento as string | null,
    estatusJuridico: fila.estatus as DocumentoPermiso['estatusJuridico'],
    archivoUrl: (fila.archivo_url as string | null) ?? '',
    archivoPath: fila.archivo_path as string | null,
  }
}

function describirCambiosDocumento(cambios: Partial<DocumentoPermiso>): string {
  const partes: string[] = []
  if (cambios.archivoPath !== undefined) partes.push('archivo reemplazado')
  if (cambios.estatusJuridico !== undefined) partes.push(`estatus → ${cambios.estatusJuridico}`)
  if (cambios.numeroFolio !== undefined) partes.push(`folio → ${cambios.numeroFolio}`)
  if (cambios.dependenciaEmisora !== undefined) partes.push('dependencia emisora actualizada')
  if (cambios.fechaEmision !== undefined) partes.push('fecha de emisión actualizada')
  if (cambios.fechaVencimiento !== undefined) partes.push('fecha de vencimiento actualizada')
  return partes.length ? `Documento actualizado: ${partes.join(', ')}` : 'Documento actualizado'
}

function documentoAFila(cambios: Partial<DocumentoPermiso>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.dependenciaEmisora !== undefined) fila.dependencia_emisora = cambios.dependenciaEmisora
  if (cambios.numeroFolio !== undefined) fila.numero_folio = cambios.numeroFolio
  if (cambios.fechaEmision !== undefined) fila.fecha_emision = cambios.fechaEmision
  if (cambios.fechaVencimiento !== undefined) fila.fecha_vencimiento = cambios.fechaVencimiento
  if (cambios.estatusJuridico !== undefined) fila.estatus = cambios.estatusJuridico
  if (cambios.archivoPath !== undefined) fila.archivo_path = cambios.archivoPath
  return fila
}

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [naves, setNaves] = useState<Nave[]>([])
  const [navesListas, setNavesListas] = useState(false)
  const [documentos, setDocumentos] = useState<DocumentoPermiso[]>([])
  const [contratos, setContratos] = useState<ContratoArrendamiento[]>([])
  const [renovaciones, setRenovaciones] = useState<RenovacionContrato[]>([])
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([])
  const [ordenesPausas, setOrdenesPausas] = useState<PausaOrden[]>([])
  const [ordenesEvidencia, setOrdenesEvidencia] = useState<EvidenciaOrden[]>([])
  const [tareasOperativas, setTareasOperativas] = useState<TareaOperativa[]>([])
  const [proyectosCapex, setProyectosCapex] = useState<ProyectoCapex[]>([])
  const [capexCotizaciones, setCapexCotizaciones] = useState<CotizacionCapex[]>([])
  const [capexVotos, setCapexVotos] = useState<VotoCapex[]>([])
  const [perfilesPorId, setPerfilesPorId] = useState<Record<string, string>>({})

  // RLS exige sesión autenticada para leer naves/documentos: se espera a que exista
  // sesión antes de pedirlas, y se vuelven a pedir en cada cambio de sesión (login,
  // logout, cambio de cuenta) — si no, un login recién hecho se queda con listas
  // vacías hasta refrescar la página, porque este efecto solo corría una vez al montar.
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) {
      setNaves([])
      setNavesListas(false)
      setDocumentos([])
      setContratos([])
      setRenovaciones([])
      setOrdenesTrabajo([])
      setOrdenesPausas([])
      setOrdenesEvidencia([])
      setTareasOperativas([])
      setProyectosCapex([])
      setCapexCotizaciones([])
      setCapexVotos([])
      setPerfilesPorId({})
      return
    }
    supabase
      .from('naves')
      .select('*')
      .then(({ data }) => {
        if (data) setNaves(data.map(naveDeFila))
        setNavesListas(true)
      })
    supabase
      .from('documentos')
      .select('*')
      .then(({ data }) => {
        if (data) setDocumentos(data.map(documentoDeFila))
      })
    supabase
      .from('contratos')
      .select('*')
      .then(({ data }) => {
        if (data) setContratos(data.map(contratoDeFila))
      })
    supabase
      .from('renovaciones')
      .select('*')
      .then(({ data }) => {
        if (data) setRenovaciones(data.map(renovacionDeFila))
      })
    supabase
      .from('ordenes_trabajo')
      .select('*')
      .then(({ data }) => {
        if (data) setOrdenesTrabajo(data.map(ordenDeFila))
      })
    supabase
      .from('ordenes_pausas')
      .select('*')
      .then(({ data }) => {
        if (data) setOrdenesPausas(data.map(pausaDeFila))
      })
    supabase
      .from('ordenes_evidencia')
      .select('*')
      .then(({ data }) => {
        if (data) setOrdenesEvidencia(data.map(evidenciaDeFila))
      })
    supabase
      .from('tareas_operativas')
      .select('*')
      .then(({ data }) => {
        if (data) setTareasOperativas(data.map(tareaDeFila))
      })
    supabase
      .from('proyectos_capex')
      .select('*')
      .then(({ data }) => {
        if (data) setProyectosCapex(data.map(capexDeFila))
      })
    supabase
      .from('capex_cotizaciones')
      .select('*')
      .then(({ data }) => {
        if (data) setCapexCotizaciones(data.map(cotizacionCapexDeFila))
      })
    supabase
      .from('capex_votos')
      .select('*')
      .then(({ data }) => {
        if (data) setCapexVotos(data.map(votoCapexDeFila))
      })
    supabase
      .from('profiles')
      .select('id,nombre')
      .then(({ data }) => {
        if (data) setPerfilesPorId(Object.fromEntries((data as { id: string; nombre: string }[]).map((p) => [p.id, p.nombre])))
      })
  }, [userId])

  const alertas = useMemo(() => calcularAlertas(documentos, contratos, ordenesTrabajo), [documentos, contratos, ordenesTrabajo])
  const tareasVivas = useMemo(() => calcularTareasVivas(ordenesTrabajo), [ordenesTrabajo])

  const value = useMemo<DataStoreContextValue>(() => {
    const capexAutorizadoTotal = capexAutorizadoTotalBase(proyectosCapex)
    return {
      naves,
      navesListas,
      naveById: (id) => naves.find((n) => n.id === id),
      agregarNave: (nave) => {
        setNaves((prev) => [...prev, nave])
        supabase
          .from('naves')
          .insert({ id: nave.id, ...naveAFila(nave) })
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar nave en Supabase:', error.message)
              return
            }
            registrarBitacora('naves', nave.id, 'alta', `Nave dada de alta: ${nave.folio} (Nave ${nave.numeroNave})`)
          })
      },
      editarNave: (id, cambios) => {
        setNaves((prev) => prev.map((n) => (n.id === id ? { ...n, ...cambios } : n)))
        supabase
          .from('naves')
          .update({ ...naveAFila(cambios), updated_at: new Date().toISOString() })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar nave en Supabase:', error.message)
              return
            }
            registrarBitacora('naves', id, 'edicion', describirCambiosNave(cambios))
          })
      },

      documentos,
      documentosPorNave: (naveId) => documentosPorNaveBase(naveId, documentos),
      editarDocumento: (id, cambios) => {
        setDocumentos((prev) => prev.map((d) => (d.id === id ? { ...d, ...cambios } : d)))
        // El query builder de Supabase es "thenable": solo dispara la petición real
        // cuando se le llama .then()/await — un `void` sobre la cadena sin eso nunca
        // manda la petición.
        supabase
          .from('documentos')
          .update(documentoAFila(cambios))
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar documento en Supabase:', error.message)
              return
            }
            registrarBitacora('documentos', id, cambios.archivoPath !== undefined ? 'archivo_reemplazado' : 'edicion', describirCambiosDocumento(cambios))
          })
      },

      contratos,
      contratoPorNaveId: (naveId) => contratos.find((c) => c.naveId === naveId),
      editarContrato: (id, cambios) => {
        setContratos((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)))
        supabase
          .from('contratos')
          .update({ ...contratoAFila(cambios), updated_at: new Date().toISOString() })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar contrato en Supabase:', error.message)
              return
            }
            registrarBitacora('contratos', id, 'edicion', describirCambiosContrato(cambios))
          })
      },

      renovaciones,
      renovacionActivaPorContrato: (contratoId) => renovacionAbierta(renovaciones, contratoId),
      resolverRenovacion: (contratoId, decision, motivo) => {
        const renovacion = renovacionAbierta(renovaciones, contratoId)
        if (!renovacion) return
        const cambios: Partial<RenovacionContrato> = decision === 'aprobar' ? { estado: 'Aprobada' } : { motivoRechazo: motivo ?? null }
        setRenovaciones((prev) => prev.map((r) => (r.id === renovacion.id ? { ...r, ...cambios } : r)))
        const filaCambios: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (cambios.estado !== undefined) filaCambios.estado = cambios.estado
        if (cambios.motivoRechazo !== undefined) filaCambios.motivo_rechazo = cambios.motivoRechazo
        supabase
          .from('renovaciones')
          .update(filaCambios)
          .eq('id', renovacion.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar renovación en Supabase:', error.message)
              return
            }
            registrarBitacora(
              'renovaciones',
              renovacion.id,
              decision === 'aprobar' ? 'aprobada' : 'terminos_rechazados',
              decision === 'aprobar' ? 'Renovación de contrato aprobada' : `Términos de renovación rechazados: ${motivo}`,
            )
          })
      },

      ordenesTrabajo,
      ordenesPorNave: (naveId) => ordenesTrabajo.filter((o) => o.naveId === naveId),
      editarOrden: (id, cambios) => {
        setOrdenesTrabajo((prev) => prev.map((o) => (o.id === id ? { ...o, ...cambios } : o)))
        actualizarOrdenEnSupabase(id, ordenAFila(cambios)).then(({ error }) => {
          if (error) {
            console.error('Error al guardar orden en Supabase:', error.message)
            return
          }
          registrarBitacora('ordenes_trabajo', id, 'edicion', describirCambiosOrden(cambios))
        })
      },

      pausaAbiertaPorOrden: (ordenId) => ordenesPausas.find((p) => p.ordenId === ordenId && !p.fin),
      pausarOrden: (ordenId, motivo) => {
        setOrdenesTrabajo((prev) => prev.map((o) => (o.id === ordenId ? { ...o, estatus: 'Esperando Refacción' } : o)))
        actualizarOrdenEnSupabase(ordenId, { estatus: 'Esperando Refacción' }).then(({ error }) => {
          if (error) {
            console.error('Error al pausar orden en Supabase:', error.message)
            return
          }
          registrarBitacora('ordenes_trabajo', ordenId, 'pausada', `Orden pausada — esperando refacción: ${motivo}`)
        })
        supabase
          .from('ordenes_pausas')
          .insert({ orden_id: ordenId, motivo })
          .select()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error al registrar pausa en Supabase:', error.message)
              return
            }
            if (data) setOrdenesPausas((prev) => [...prev, ...data.map(pausaDeFila)])
          })
      },
      reanudarOrden: (ordenId) => {
        const pausa = ordenesPausas.find((p) => p.ordenId === ordenId && !p.fin)
        setOrdenesTrabajo((prev) => prev.map((o) => (o.id === ordenId ? { ...o, estatus: 'En ejecución' } : o)))
        actualizarOrdenEnSupabase(ordenId, { estatus: 'En ejecución' }).then(({ error }) => {
          if (error) {
            console.error('Error al reanudar orden en Supabase:', error.message)
            return
          }
          registrarBitacora('ordenes_trabajo', ordenId, 'reanudada', 'Orden reanudada')
        })
        if (!pausa) return
        const fin = new Date().toISOString()
        setOrdenesPausas((prev) => prev.map((p) => (p.id === pausa.id ? { ...p, fin } : p)))
        supabase
          .from('ordenes_pausas')
          .update({ fin })
          .eq('id', pausa.id)
          .then(({ error }) => {
            if (error) console.error('Error al cerrar pausa en Supabase:', error.message)
          })
      },

      evidenciaPendientePorOrden: (ordenId) => ordenesEvidencia.find((e) => e.ordenId === ordenId && e.resultado === 'Pendiente'),
      enviarEvidencia: (ordenId, archivo) => {
        const path = `evidencia-ordenes/${ordenId}/${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
        supabase
          .storage.from('documentos')
          .upload(path, archivo)
          .then(({ error: errorSubida }) => {
            if (errorSubida) {
              console.error('Error al subir evidencia a Supabase Storage:', errorSubida.message)
              return
            }
            supabase
              .from('ordenes_evidencia')
              .insert({ orden_id: ordenId, archivo_path: path, autor_id: userId ?? null })
              .select()
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error al registrar evidencia en Supabase:', error.message)
                  return
                }
                if (data) setOrdenesEvidencia((prev) => [...prev, ...data.map(evidenciaDeFila)])
                setOrdenesTrabajo((prev) => prev.map((o) => (o.id === ordenId ? { ...o, estatus: 'Pendiente de Evidencia' } : o)))
                actualizarOrdenEnSupabase(ordenId, { estatus: 'Pendiente de Evidencia' }).then(({ error }) => {
                  if (error) {
                    console.error('Error al guardar orden en Supabase:', error.message)
                    return
                  }
                  registrarBitacora('ordenes_trabajo', ordenId, 'evidencia_enviada', 'Orden enviada a validación con evidencia de cierre')
                })
              })
          })
      },
      resolverEvidenciaCierre: (ordenId, decision, motivo) => {
        const evidencia = ordenesEvidencia.find((e) => e.ordenId === ordenId && e.resultado === 'Pendiente')
        const nuevoEstatus: OrdenTrabajo['estatus'] = decision === 'aprobar' ? 'Validado' : 'En ejecución'
        const fechaCierre = decision === 'aprobar' ? new Date().toISOString().slice(0, 10) : undefined
        setOrdenesTrabajo((prev) =>
          prev.map((o) => (o.id === ordenId ? { ...o, estatus: nuevoEstatus, fechaCierre: fechaCierre ?? o.fechaCierre } : o)),
        )
        actualizarOrdenEnSupabase(ordenId, { estatus: nuevoEstatus, ...(fechaCierre !== undefined ? { fecha_cierre: fechaCierre } : {}) }).then(
          ({ error }) => {
            if (error) {
              console.error('Error al guardar orden en Supabase:', error.message)
              return
            }
            registrarBitacora(
              'ordenes_trabajo',
              ordenId,
              decision === 'aprobar' ? 'cierre_validado' : 'cierre_rechazado',
              decision === 'aprobar' ? 'Cierre de orden validado' : `Cierre rechazado, regresa a ejecución: ${motivo}`,
            )
          },
        )
        if (!evidencia) return
        const fechaAprobacion = new Date().toISOString()
        setOrdenesEvidencia((prev) =>
          prev.map((e) =>
            e.id === evidencia.id
              ? decision === 'aprobar'
                ? { ...e, resultado: 'Aceptada', fechaAprobacion }
                : { ...e, resultado: 'Rechazada', motivoRechazo: motivo ?? null, retrabajo: true }
              : e,
          ),
        )
        supabase
          .from('ordenes_evidencia')
          .update(
            decision === 'aprobar'
              ? { resultado: 'Aceptada', fecha_aprobacion: fechaAprobacion }
              : { resultado: 'Rechazada', motivo_rechazo: motivo, retrabajo: true },
          )
          .eq('id', evidencia.id)
          .then(({ error }) => {
            if (error) console.error('Error al resolver evidencia en Supabase:', error.message)
          })
      },

      tareasOperativas,
      editarTarea: (id, cambios) => {
        setTareasOperativas((prev) => prev.map((t) => (t.id === id ? { ...t, ...cambios } : t)))
        supabase
          .from('tareas_operativas')
          .update({ ...tareaAFila(cambios), updated_at: new Date().toISOString() })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar tarea en Supabase:', error.message)
              return
            }
            registrarBitacora('tareas_operativas', id, 'edicion', describirCambiosTarea(cambios))
          })
      },

      proyectosCapex,
      proyectoCapexPorNave: (naveId) => proyectoCapexPorNaveBase(naveId, proyectosCapex),
      agregarProyectoCapex: (proyecto) => {
        const id = `CPX-${Date.now()}`
        const codigo = `CPX-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
        const nuevo: ProyectoCapex = {
          id,
          codigo,
          naveId: proyecto.naveId,
          titulo: proyecto.titulo,
          justificacionTecnica: proyecto.justificacionTecnica,
          inversionEstimada: proyecto.inversionEstimada,
          roiProyectadoPct: proyecto.roiProyectadoPct,
          paybackAnios: proyecto.paybackAnios,
          estatusComite: 'Pendiente 3ra Cotización',
          motivoRechazo: null,
          proveedorSeleccionado: null,
          avanceFisicoPct: 0,
          avanceFinancieroPct: 0,
        }
        setProyectosCapex((prev) => [...prev, nuevo])
        supabase
          .from('proyectos_capex')
          .insert({
            id,
            codigo,
            nave_id: nuevo.naveId,
            titulo: nuevo.titulo,
            justificacion_tecnica: nuevo.justificacionTecnica,
            inversion_estimada: nuevo.inversionEstimada,
            roi_proyectado_pct: nuevo.roiProyectadoPct,
            payback_anios: nuevo.paybackAnios,
            estatus_comite: nuevo.estatusComite,
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar proyecto CapEx en Supabase:', error.message)
              return
            }
            registrarBitacora('proyectos_capex', id, 'alta', `Proyecto CapEx creado: ${codigo} — ${nuevo.titulo}`)
          })
      },
      editarCapex: (id, cambios) => {
        setProyectosCapex((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
        supabase
          .from('proyectos_capex')
          .update({ ...capexAFila(cambios), updated_at: new Date().toISOString() })
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.error('Error al guardar proyecto CapEx en Supabase:', error.message)
              return
            }
            registrarBitacora('proyectos_capex', id, 'edicion', describirCambiosCapex(cambios))
          })
      },
      capexAutorizadoTotal,
      capexDisponiblePct: capexDisponiblePctBase(proyectosCapex),

      capexCotizaciones,
      cotizacionesPorProyecto: (proyectoId) => capexCotizaciones.filter((c) => c.proyectoId === proyectoId),
      registrarCotizacionCapex: (proyectoId, cotizacion) => {
        supabase
          .from('capex_cotizaciones')
          .insert({
            proyecto_capex_id: proyectoId,
            proveedor: cotizacion.proveedor,
            monto: cotizacion.monto,
            garantia_meses: cotizacion.garantiaMeses,
            recibida: true,
          })
          .select()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error al registrar cotización CapEx en Supabase:', error.message)
              return
            }
            if (data) setCapexCotizaciones((prev) => [...prev, ...data.map(cotizacionCapexDeFila)])
            registrarBitacora('proyectos_capex', proyectoId, 'cotizacion_registrada', `Cotización recibida de ${cotizacion.proveedor}`)
          })
      },
      enviarCapexAComite: (proyectoId) => {
        setProyectosCapex((prev) => prev.map((p) => (p.id === proyectoId ? { ...p, estatusComite: 'En Revisión Comité' } : p)))
        supabase
          .from('proyectos_capex')
          .update({ estatus_comite: 'En Revisión Comité', updated_at: new Date().toISOString() })
          .eq('id', proyectoId)
          .then(({ error }) => {
            if (error) {
              console.error('Error al enviar proyecto CapEx a comité en Supabase:', error.message)
              return
            }
            registrarBitacora('proyectos_capex', proyectoId, 'enviado_a_comite', 'Proyecto enviado a revisión del comité')
          })
      },

      capexVotos,
      votosPorProyecto: (proyectoId) => capexVotos.filter((v) => v.proyectoId === proyectoId),
      miVotoPorProyecto: (proyectoId) => capexVotos.find((v) => v.proyectoId === proyectoId && v.usuarioId === userId),
      votarCapex: (proyectoId, sentido, comentario) => {
        const votoExistente = capexVotos.find((v) => v.proyectoId === proyectoId && v.usuarioId === userId)
        const fecha = new Date().toISOString()
        if (votoExistente) {
          setCapexVotos((prev) => prev.map((v) => (v.id === votoExistente.id ? { ...v, sentido, comentario: comentario ?? null, fecha } : v)))
          supabase
            .from('capex_votos')
            .update({ sentido, comentario: comentario ?? null, fecha })
            .eq('id', votoExistente.id)
            .then(({ error }) => {
              if (error) {
                console.error('Error al actualizar voto CapEx en Supabase:', error.message)
                return
              }
              registrarBitacora('proyectos_capex', proyectoId, 'voto_actualizado', `Voto del comité actualizado: ${sentido}`)
            })
          return
        }
        supabase
          .from('capex_votos')
          .insert({ proyecto_id: proyectoId, usuario_id: userId ?? null, sentido, comentario: comentario ?? null })
          .select()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error al registrar voto CapEx en Supabase:', error.message)
              return
            }
            if (data) setCapexVotos((prev) => [...prev, ...data.map(votoCapexDeFila)])
            registrarBitacora('proyectos_capex', proyectoId, 'voto_registrado', `Voto del comité registrado: ${sentido}`)
          })
      },
      resolverComiteCapex: (proyectoId, decision, motivo) => {
        const cambios: Partial<ProyectoCapex> =
          decision === 'aprobar' ? { estatusComite: 'Aprobado por Dirección', motivoRechazo: null } : { estatusComite: 'Rechazado', motivoRechazo: motivo ?? null }
        setProyectosCapex((prev) => prev.map((p) => (p.id === proyectoId ? { ...p, ...cambios } : p)))
        supabase
          .from('proyectos_capex')
          .update({ ...capexAFila(cambios), updated_at: new Date().toISOString() })
          .eq('id', proyectoId)
          .then(({ error }) => {
            if (error) {
              console.error('Error al resolver comité CapEx en Supabase:', error.message)
              return
            }
            registrarBitacora(
              'proyectos_capex',
              proyectoId,
              decision === 'aprobar' ? 'aprobado_por_direccion' : 'rechazado',
              decision === 'aprobar' ? 'Proyecto aprobado por Dirección' : `Proyecto rechazado por el comité: ${motivo}`,
            )
          })
      },

      perfilesPorId,

      alertas,
      tareasVivas,
      requerimientosCriticos: requerimientosCriticosBase(alertas),
      vencimientosContrato90Dias: vencimientosContrato90DiasBase(contratos),

      totalNaves: portafolioKpis.totalNaves(naves),
      navesOcupadas: portafolioKpis.navesOcupadas(naves),
      ocupacionGlobalPct: portafolioKpis.ocupacionGlobalPct(naves),
      glaTotal: portafolioKpis.glaTotal(naves),
      glaDisponible: portafolioKpis.glaDisponible(naves),
      ingresoMensualTotalUSD: portafolioKpis.ingresoMensualTotalUSD(contratos),
      cobranzaAlDiaPct: portafolioKpis.cobranzaAlDiaPct(contratos),
      certificacionesLEEDCount: portafolioKpis.certificacionesLEEDCount(naves),
      cumplimientoSTPSPromedio: portafolioKpis.cumplimientoSTPSPromedio(naves),
      desgloseIndustria: portafolioKpis.desgloseIndustria(naves),
      serieNOIAnual: portafolioKpis.serieNOIAnual(contratos),

      correctivosActivos: mantenimientoKpis.correctivosActivos(ordenesTrabajo),
      capexProyectosMayores: mantenimientoKpis.capexProyectosMayores(proyectosCapex),
      capexAutorizadoAnio: mantenimientoKpis.capexAutorizadoAnio(proyectosCapex),
      slaPromedioResolucionHoras: mantenimientoKpis.slaPromedioResolucionHoras(ordenesTrabajo),
      proyectoMayorEnCurso: mantenimientoKpis.proyectoMayorEnCurso(proyectosCapex),
    }
  }, [
    naves,
    navesListas,
    documentos,
    contratos,
    renovaciones,
    ordenesTrabajo,
    ordenesPausas,
    ordenesEvidencia,
    tareasOperativas,
    proyectosCapex,
    capexCotizaciones,
    capexVotos,
    perfilesPorId,
    alertas,
    tareasVivas,
    userId,
  ])

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext)
  if (!ctx) throw new Error('useDataStore debe usarse dentro de DataStoreProvider')
  return ctx
}
