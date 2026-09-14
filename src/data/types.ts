// Modelo de datos — DMI Industrial Asset Management
// Todas las pantallas consumen estos mismos tipos y los catálogos en src/data/
// para garantizar consistencia entre Portafolio, Expediente 360 y Tareas/CapEx.

export type Region = 'Bajío' | 'Norte' | 'Occidente'

export type EstatusOperativo =
  | 'Óptimo Operativo'
  | 'Alerta Predial Pendiente'
  | 'En Renovación Formal'
  | 'Mant. Preventivo HVAC'
  | 'En Mora'

// Ciclo de vida real de un documento del expediente — sección 6.2 del prompt de
// referencia. El paso a "En Mora" es automático al cumplirse la fecha de vencimiento
// sobre un documento Aprobado/Vigente, nunca una acción manual.
export type EstatusDocumental = 'Pendiente' | 'En Revisión' | 'Aprobado/Vigente' | 'Rechazado' | 'Aprobado por Excepción' | 'En Mora'

export type Industria =
  | 'Manufactura Avanzada'
  | 'Logística & E-commerce'
  | 'Automotriz & Tier 1'
  | 'Otros'

export interface ParqueIndustrial {
  id: string
  nombre: string
  region: Region
  estado: string
  ciudad: string
  corredorIndustrial: string
}

export interface Nave {
  id: string
  folio: string // ej. DMI-JAL-SLT-N04
  parqueId: string
  numeroNave: string
  direccion: string
  coordenadas: { lat: number; lng: number }
  tipoPropiedad: 'Nave Industrial' | 'Bodega Logística' | 'Terreno' | 'Nave BTS'
  claseActivo: 'Clase A' | 'Clase B'
  estatusOperativo: EstatusOperativo
  superficieTerreno: number // m²
  superficieConstruccion: number // m²
  gla: number // m² área bruta arrendable
  areaOficinas: number // m²
  alturaLibre: number // metros
  numeroAndenes: number
  numeroRampas: number
  capacidadElectrica: number // KVA
  pisoFFFL: string // ej. "FF 50 / FL 75"
  bahiaColumnas: string // ej. "12m x 24m"
  usoDeSuelo: string // ej. "I-2 Industria Mediana e Intensiva"
  sistemaConstructivo: string // ej. "Estructura metálica prefabricada / muros de block"
  numeroCajonesEstacionamiento: number
  tipoIluminacion: string // ej. "LED alta eficiencia (galpón) / ahorradora (oficinas)"
  certificacionLEED: 'LEED Gold' | 'LEED Silver' | 'LEED Platinum' | null
  certificacionESG: boolean
  cumplimientoSTPS: number // % NOM vigente
  ocupada: boolean
  fechaEntrega: string // ISO
}

export interface Contacto {
  nombre: string
  puesto: string
  email: string
  telefono: string
}

export interface Inquilino {
  id: string
  razonSocial: string
  nombreComercial: string
  industria: Industria
  representanteLegal: Contacto
  plantManager: Contacto
  contactoMantenimiento: Contacto
  contactoCxP: Contacto
}

export type TipoContrato = 'Triple Net (NNN)' | 'Doble Neto (NN)' | 'Bruto Modificado'

export interface ContratoArrendamiento {
  id: string
  naveId: string
  inquilinoId: string
  fechaInicio: string
  fechaEntrega: string
  fechaVencimiento: string
  plazoMeses: number
  moneda: 'USD' | 'MXN'
  rentaBaseMensual: number
  tarifaPorM2: number
  cam: number // cuota de mantenimiento (CAM) mensual
  depositoGarantia: number
  esquemaIncremento: string // ej. "3% anual fijo"
  opcionesRenovacion: string
  tipoContrato: TipoContrato
  avalista: string
  clausulasEspeciales: string[]
  // Ciclo de vida del contrato en sí (no el de una negociación de renovación en curso,
  // que vive aparte en RenovacionContrato). "Terminación Programada": Dirección decidió
  // no renovar; el contrato sigue vigente hasta su fecha de vencimiento y luego pasa a
  // historial (no reabre negociación).
  estatus: 'Vigente' | 'Terminación Programada' | 'Vencido' | 'Terminado' | 'En Mora'
}

export type EstadoRenovacion = 'Pendiente' | 'En Revisión' | 'Pendiente de Firma' | 'Aprobada' | 'No Renovada'

// Proceso de negociación de renovación de un contrato — independiente del ciclo de vida
// del contrato (ContratoArrendamiento.estatus). Un contrato "en revisión" en la UI es en
// realidad un contrato Vigente con una RenovacionContrato abierta (estado distinto de
// Aprobada/No Renovada).
export interface RenovacionContrato {
  id: string
  contratoId: string
  estado: EstadoRenovacion
  motivoRechazo: string | null
  motivoNoRenovacion: string | null
  fechaApertura: string | null
}

export type TipoDocumento =
  | 'Licencia de Construcción'
  | 'Manifestación de Impacto Ambiental'
  | 'Dictamen de Protección Civil'
  | 'Memoria de Cálculo Estructural'
  | 'Póliza de Responsabilidad Civil'
  | 'Póliza Multirriesgo Industrial'
  | 'Predial'
  | 'Contrato CFE'
  | 'Contrato de Agua y Drenaje'
  | 'Licencia Ambiental Estatal'

export interface DocumentoPermiso {
  id: string
  naveId: string
  tipo: TipoDocumento
  dependenciaEmisora: string
  numeroFolio: string
  fechaEmision: string
  fechaVencimiento: string | null
  estatusJuridico: EstatusDocumental
  archivoUrl: string
  // Ruta real dentro del bucket privado de Supabase Storage ("documentos"); null si
  // nadie ha subido el archivo todavía. La URL de descarga/vista se genera al vuelo
  // (firmada, vigencia de 5 minutos) — nunca se guarda una URL pública permanente.
  archivoPath: string | null
}

export type RegimenPropiedad = 'Propiedad Privada' | 'Copropiedad' | 'Fideicomiso Inmobiliario'

export interface PropietarioLegal {
  naveId: string
  razonSocial: string
  rfc: string
  regimenPropiedad: RegimenPropiedad
  numeroEscritura: string
  notario: string // nombre + número de notaría + ciudad
  folioRPP: string // Registro Público de la Propiedad
  gravamenes: string | null // descripción del gravamen o null si está libre
}

export type TipoEstudioTecnico = 'Mecánica de Suelos' | 'Estudio Topográfico' | 'Ambiental Fase I' | 'PCA (Property Condition Assessment)'

export interface EstudioTecnico {
  id: string
  naveId: string
  tipo: TipoEstudioTecnico
  empresaConsultora: string
  fechaRealizacion: string
  resultado: string
  archivoUrl: string
}

export type TipoContactoEmergencia = 'Bomberos' | 'Cruz Roja / Ambulancia' | 'Protección Civil Municipal' | 'Seguridad Privada 24/7'

export interface ContactoEmergencia {
  naveId: string
  tipo: TipoContactoEmergencia
  nombre: string
  telefono: string
}

export interface Broker {
  id: string
  nombre: string
  inmobiliaria: string
  telefono: string
  email: string
}

export type TipoSistemaCritico =
  | 'Sistema Contra Incendio (SCI)'
  | 'Subestación Eléctrica'
  | 'HVAC'
  | 'Planta de Emergencia'
  | 'Cubierta y Techo'
  | 'Pisos Industriales'
  | 'Andenes & Rampas'

export interface SistemaCritico {
  id: string
  naveId: string
  tipo: TipoSistemaCritico
  codigoReferencia: string
  vendor: string
  frecuenciaMantenimiento: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual'
  costoAnualEstimado: number
  fechaUltimoMantenimiento: string
  fechaProximoMantenimiento: string
  indicadorSalud: string // ej. "Salud Estructural 96%"
  estatusSalud: 'Óptimo' | 'Alerta' | 'Crítico'
  ultimaIntervencion: string
}

export type PrioridadTicket = 'Crítica' | 'Alta' | 'Media' | 'Baja'
// Abierta → En ejecución → (Esperando Refacción, si aplica) → Pendiente de Evidencia → Validado.
// Cancelada es un estado alterno terminal, distinto de Validado, desde cualquier estado activo.
export type EstatusTicket = 'Abierta' | 'En ejecución' | 'Esperando Refacción' | 'Pendiente de Evidencia' | 'Validado' | 'Cancelada'

export interface OrdenTrabajo {
  id: string
  folio: string
  naveId: string
  sistemaCriticoId: string | null
  categoria: string
  descripcion: string
  prioridad: PrioridadTicket
  slaHoras: number
  contratistaId: string
  costoEstimado: number
  estatus: EstatusTicket
  fechaCreacion: string
  fechaCompromiso: string
  fechaCierre: string | null
  motivoCancelacion: string | null
}

// Ventana de pausa de una orden (p. ej. "Esperando Refacción") — fin null mientras sigue
// pausada. Independiente del estatus de la orden, que solo refleja el estado actual.
export interface PausaOrden {
  id: string
  ordenId: string
  inicio: string
  fin: string | null
  motivo: string | null
}

export type ResultadoEvidencia = 'Pendiente' | 'Aceptada' | 'Rechazada'

// Evidencia de cierre subida por el Facility Manager al enviar una orden a validación;
// Facility Manager (mismo rol, ve la calidad del trabajo antes de cerrar) la acepta o
// rechaza — un rechazo regresa la orden a "En ejecución" para retrabajo.
export interface EvidenciaOrden {
  id: string
  ordenId: string
  archivoPath: string | null
  fecha: string
  resultado: ResultadoEvidencia
  motivoRechazo: string | null
  retrabajo: boolean | null
  fechaAprobacion: string | null
  comentario: string | null
}

export interface Contratista {
  id: string
  nombre: string
  especialidad: string
  calificacion: number // 1-5
  polizaRC: 'Vigente' | 'Por Vencer' | 'Vencida'
  trabajosDelAno: number
  porcentajeOnTime: number
}

// Rechazado es terminal: sale del pipeline activo y no se reenvía al comité.
export type EstatusComiteCapex =
  | 'En Revisión Comité'
  | 'Aprobado por Dirección'
  | 'Pendiente 3ra Cotización'
  | 'En Ejecución'
  | 'Concluido'
  | 'Rechazado'

export interface ProyectoCapex {
  id: string
  codigo: string
  naveId: string
  titulo: string
  justificacionTecnica: string
  inversionEstimada: number
  roiProyectadoPct: number
  paybackAnios: number
  estatusComite: EstatusComiteCapex
  motivoRechazo: string | null
  proveedorSeleccionado: string | null
  avanceFisicoPct: number
  avanceFinancieroPct: number
}

// Cotizaciones recibidas por proyecto — tabla propia (capex_cotizaciones) en vez de
// arreglo embebido, para que Property Manager / Facility Manager las vayan registrando
// conforme llegan realmente, igual que ordenes_pausas/ordenes_evidencia en Mantenimiento.
export interface CotizacionCapex {
  id: string
  proyectoId: string
  proveedor: string
  monto: number
  garantiaMeses: number
  recibida: boolean
}

// Voto del comité (Dirección) sobre un proyecto en 'En Revisión Comité' — un registro por
// usuario y proyecto; se puede corregir antes de que Dirección resuelva el proyecto.
export type SentidoVoto = 'A favor' | 'En contra' | 'Abstención'

export interface VotoCapex {
  id: string
  proyectoId: string
  usuarioId: string | null
  sentido: SentidoVoto
  comentario: string | null
  fecha: string
}

export type CategoriaTarea =
  | 'Regulatorio Legal'
  | 'CapEx Prioritario'
  | 'Correctivo Inmediato'
  | 'Preventivo'
  | 'Mantenimiento Mayor'
  | 'Cobranza CAM'
  | 'Sanidad Operativa'

export type ColumnaKanban = 'Por Iniciar' | 'En Cotización' | 'En Ejecución' | 'Completado & Auditado'

export interface TareaOperativa {
  id: string
  categoria: CategoriaTarea
  titulo: string
  naveId: string
  responsable: string
  columna: ColumnaKanban
  costoEstimado: number | null
  avancePct: number | null
  cotizacionesRecibidas: string | null
  slaRestanteHoras: number | null
}

export type TipoAlerta =
  | 'Póliza Corporativa'
  | 'Tesorería Municipal'
  | 'Leasing Comercial'
  | 'Protección Civil'
  | 'Licencia Ambiental'
  | 'Mantenimiento Sistema Crítico'
  | 'SLA de Ticket'

export interface AlertaVencimiento {
  id: string
  tipo: TipoAlerta
  naveId: string
  descripcion: string
  diasParaVencer: number
  urgencia: 'Crítico Inminente' | 'Garantía Legal' | 'En Cumplimiento'
  montoOSuperficie: string | null
  responsable: string
  accion: string
  estatus: 'Pendiente' | 'Atendida'
}

export interface Usuario {
  nombre: string
  puesto: string
  rol: 'Property Manager' | 'Dirección' | 'Contabilidad'
  navesAsignadas: string[] | 'todas'
  avatarIniciales: string
}

export type RFPEstatus = 'recepcion' | 'lista' | 'vence-pronto'

export interface PropuestaProveedor {
  proveedor: string
  precio: number
  garantiaMeses: number
  recibida: boolean
  mejorOferta: boolean
}

export interface SolicitudCotizacion {
  id: string
  folio: string
  naveId: string
  titulo: string
  propuestas: PropuestaProveedor[]
  recibidas: number
  total: number
  diasParaVencer: number | null
}

export interface TareaViva {
  id: string
  titulo: string
  naveId: string
  categoria: string
  responsable: string
  columna: 'urgente' | 'en-ejecucion' | 'completada'
  avancePct: number | null
  estatusCierre: 'Cerrado & Auditado' | 'Facturado' | null
}

export interface EventoCalendario {
  id: string
  dia: number // 1-28, semana simplificada
  tipo: string
  hora: string
  descripcion: string
  responsable: string
  naveId: string
}
