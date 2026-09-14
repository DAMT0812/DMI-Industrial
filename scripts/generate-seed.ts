// Fase 6a: genera supabase/seed/seed.sql a partir de los datos de ejemplo actuales en src/data.
// Uso: npx tsx scripts/generate-seed.ts
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
import {
  parques,
  brokers,
  brokerPorNaveId,
  contratistas,
  inquilinos,
  naves,
  documentos,
  contratos,
  sistemasCriticos,
  ordenesTrabajo,
  tareasOperativas,
  proyectosCapex,
  solicitudesCotizacion,
  propietariosLegales,
  estudiosTecnicos,
  contactosEmergencia,
  eventosCalendario,
  matrizConfiabilidad,
} from '../src/data'

function esc(v: string): string {
  return v.replace(/'/g, "''")
}

function sqlStr(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'null'
  return `'${esc(v)}'`
}

function sqlNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'null'
  return String(v)
}

function sqlBool(v: boolean): string {
  return v ? 'true' : 'false'
}

function sqlJsonb(v: unknown): string {
  return `'${esc(JSON.stringify(v))}'::jsonb`
}

function sqlTextArray(v: string[]): string {
  if (v.length === 0) return "'{}'"
  return `ARRAY[${v.map((s) => sqlStr(s)).join(', ')}]`
}

function insertStatement(table: string, columns: string[], rows: string[][]): string {
  if (rows.length === 0) return `-- ${table}: sin filas\n`
  const values = rows.map((r) => `  (${r.join(', ')})`).join(',\n')
  return `insert into ${table} (${columns.join(', ')}) values\n${values}\non conflict (id) do nothing;\n`
}

// documentos.ts ya emite el vocabulario real de estatus (Fase 6d) — no hace falta
// mapeo aquí, se usa d.estatusJuridico directamente.
const TIPOS_DOCUMENTO_SIN_VIGENCIA = new Set(['Licencia de Construcción', 'Manifestación de Impacto Ambiental', 'Memoria de Cálculo Estructural'])
const ESTATUS_ORDEN_A_ESTATUS: Record<string, string> = {
  Abierta: 'Abierta',
  'En ejecución': 'En Proceso',
  'Esperando Refacción': 'Esperando Refacción',
  'Pendiente de Evidencia': 'Pendiente de Evidencia',
  Validado: 'Validado',
  Cancelada: 'Cancelada',
}
const TIPO_SISTEMA_A_CATALOGO: Record<string, string> = {
  'Sistema Contra Incendio (SCI)': 'SC-01',
  'Subestación Eléctrica': 'SC-02',
  'Planta de Emergencia': 'SC-03',
  'Protección Civil': 'SC-04',
  HVAC: 'SC-05',
  'Hidrosanitario y Cisternas': 'SC-06',
  'Andenes & Rampas': 'SC-07',
  'PTAR / Cárcamo': 'SC-08',
  'Paneles Solares / Inversores': 'SC-09',
  'Cubierta y Techo': 'SC-10',
  'Pisos Industriales': 'SC-11',
  'Áreas Verdes / Jardinería Exterior': 'SC-12',
}

const lines: string[] = []
lines.push('-- Generado automáticamente por scripts/generate-seed.ts — no editar a mano.\n')

// parques
lines.push(
  insertStatement(
    'parques',
    ['id', 'nombre', 'region', 'municipio', 'estado', 'corredor_industrial'],
    parques.map((p) => [sqlStr(p.id), sqlStr(p.nombre), sqlStr(p.region), sqlStr(p.ciudad), sqlStr(p.estado), sqlStr(p.corredorIndustrial)])
  )
)

// brokers
lines.push(
  insertStatement(
    'brokers',
    ['id', 'nombre', 'inmobiliaria', 'telefono', 'email'],
    brokers.map((b) => [sqlStr(b.id), sqlStr(b.nombre), sqlStr(b.inmobiliaria), sqlStr(b.telefono), sqlStr(b.email)])
  )
)

// contratistas
lines.push(
  insertStatement(
    'contratistas',
    ['id', 'nombre', 'especialidades', 'regiones_atendidas', 'calificacion', 'poliza_rc', 'trabajos_del_ano', 'porcentaje_on_time'],
    contratistas.map((c) => [
      sqlStr(c.id),
      sqlStr(c.nombre),
      sqlTextArray([c.especialidad]),
      sqlTextArray([]),
      sqlNum(c.calificacion),
      sqlStr(c.polizaRC),
      sqlNum(c.trabajosDelAno),
      sqlNum(c.porcentajeOnTime),
    ])
  )
)

// inquilinos
lines.push(
  insertStatement(
    'inquilinos',
    ['id', 'razon_social', 'nombre_comercial', 'industria', 'representante_legal', 'plant_manager', 'contacto_mantenimiento', 'contacto_cxp'],
    inquilinos.map((i) => [
      sqlStr(i.id),
      sqlStr(i.razonSocial),
      sqlStr(i.nombreComercial),
      sqlStr(i.industria),
      sqlJsonb(i.representanteLegal),
      sqlJsonb(i.plantManager),
      sqlJsonb(i.contactoMantenimiento),
      sqlJsonb(i.contactoCxP),
    ])
  )
)

// naves (requiere parques y brokers ya insertados antes)
// El inquilino de cada nave ya no se denormaliza en naves: se deriva del contrato activo
// (contratos.inquilino_id), evitando la doble fuente de verdad que tenía la maqueta.
function expedienteCompleto(naveId: string): boolean {
  const docsDeLaNave = documentos.filter((d) => d.naveId === naveId)
  if (docsDeLaNave.length < 10) return false
  return docsDeLaNave.every((d) => d.estatusJuridico === 'Aprobado/Vigente')
}

lines.push(
  insertStatement(
    'naves',
    [
      'id', 'folio', 'parque_id', 'broker_id', 'numero_nave', 'direccion', 'lat', 'lng',
      'tipo_propiedad', 'clase_activo', 'estatus_operativo', 'superficie_terreno', 'superficie_construccion',
      'gla', 'area_oficinas', 'altura_libre', 'numero_andenes', 'numero_rampas', 'capacidad_electrica',
      'piso_fffl', 'bahia_columnas', 'uso_de_suelo', 'sistema_constructivo', 'numero_cajones_estacionamiento',
      'tipo_iluminacion', 'certificacion_leed', 'certificacion_esg', 'cumplimiento_stps', 'ocupada',
      'fecha_entrega', 'estado_alta', 'estado_expediente',
    ],
    naves.map((n) => [
      sqlStr(n.id), sqlStr(n.folio), sqlStr(n.parqueId), sqlStr(brokerPorNaveId[n.id] ?? null), sqlStr(n.numeroNave),
      sqlStr(n.direccion), sqlNum(n.coordenadas.lat), sqlNum(n.coordenadas.lng),
      sqlStr(n.tipoPropiedad), sqlStr(n.claseActivo), sqlStr(n.estatusOperativo), sqlNum(n.superficieTerreno),
      sqlNum(n.superficieConstruccion), sqlNum(n.gla), sqlNum(n.areaOficinas), sqlNum(n.alturaLibre),
      sqlNum(n.numeroAndenes), sqlNum(n.numeroRampas), sqlNum(n.capacidadElectrica), sqlStr(n.pisoFFFL),
      sqlStr(n.bahiaColumnas), sqlStr(n.usoDeSuelo), sqlStr(n.sistemaConstructivo), sqlNum(n.numeroCajonesEstacionamiento),
      sqlStr(n.tipoIluminacion), sqlStr(n.certificacionLEED), sqlBool(n.certificacionESG), sqlNum(n.cumplimientoSTPS),
      sqlBool(n.ocupada), sqlStr(n.fechaEntrega), sqlStr('Activo'), sqlStr(expedienteCompleto(n.id) ? 'Expediente Validado' : 'Expediente Incompleto'),
    ])
  )
)

// documentos
lines.push(
  insertStatement(
    'documentos',
    ['id', 'nave_id', 'tipo', 'requiere_vigencia', 'dependencia_emisora', 'numero_folio', 'fecha_emision', 'fecha_vencimiento', 'estatus', 'archivo_url'],
    documentos.map((d) => [
      sqlStr(d.id), sqlStr(d.naveId), sqlStr(d.tipo), sqlBool(!TIPOS_DOCUMENTO_SIN_VIGENCIA.has(d.tipo)), sqlStr(d.dependenciaEmisora), sqlStr(d.numeroFolio),
      sqlStr(d.fechaEmision), sqlStr(d.fechaVencimiento), sqlStr(d.estatusJuridico), sqlStr(d.archivoUrl),
    ])
  )
)

// contratos — vigencia siempre arranca en 'Vigente'; el flujo de renovación (si el dato
// de la maqueta lo insinuaba, ej. 'En Revisión') se gestiona aparte en la tabla renovaciones,
// que se deja vacía en el seed y se alimenta desde la app (Fase 6g).
lines.push(
  insertStatement(
    'contratos',
    [
      'id', 'nave_id', 'inquilino_id', 'fecha_inicio', 'fecha_entrega', 'fecha_vencimiento', 'plazo_meses',
      'moneda', 'renta_base_mensual', 'tarifa_por_m2', 'cam', 'deposito_garantia', 'esquema_incremento',
      'opciones_renovacion', 'tipo_contrato', 'avalista', 'clausulas_especiales', 'vigencia',
    ],
    contratos.map((c) => [
      sqlStr(c.id), sqlStr(c.naveId), sqlStr(c.inquilinoId), sqlStr(c.fechaInicio), sqlStr(c.fechaEntrega),
      sqlStr(c.fechaVencimiento), sqlNum(c.plazoMeses), sqlStr(c.moneda), sqlNum(c.rentaBaseMensual),
      sqlNum(c.tarifaPorM2), sqlNum(c.cam), sqlNum(c.depositoGarantia), sqlStr(c.esquemaIncremento),
      sqlStr(c.opcionesRenovacion), sqlStr(c.tipoContrato), sqlStr(c.avalista), sqlTextArray(c.clausulasEspeciales),
      sqlStr('Vigente'),
    ])
  )
)

// sistemas_criticos_nave (instancia por nave del catálogo maestro de 12 sistemas)
lines.push(
  insertStatement(
    'sistemas_criticos_nave',
    [
      'id', 'nave_id', 'sistema_id', 'codigo_referencia', 'vendor', 'costo_anual_estimado',
      'fecha_ultimo_mantenimiento', 'fecha_proximo_mantenimiento', 'indicador_salud', 'estatus_salud', 'ultima_intervencion',
    ],
    sistemasCriticos.map((s) => [
      sqlStr(s.id), sqlStr(s.naveId), sqlStr(TIPO_SISTEMA_A_CATALOGO[s.tipo] ?? null), sqlStr(s.codigoReferencia), sqlStr(s.vendor),
      sqlNum(s.costoAnualEstimado), sqlStr(s.fechaUltimoMantenimiento),
      sqlStr(s.fechaProximoMantenimiento), sqlStr(s.indicadorSalud), sqlStr(s.estatusSalud), sqlStr(s.ultimaIntervencion),
    ])
  )
)

// ordenes_trabajo (requiere sistemas_criticos_nave y contratistas ya insertados)
lines.push(
  insertStatement(
    'ordenes_trabajo',
    [
      'id', 'folio', 'nave_id', 'sistema_critico_id', 'categoria', 'descripcion', 'prioridad', 'sla_horas',
      'contratista_id', 'costo_estimado', 'estatus', 'fecha_creacion', 'fecha_compromiso', 'fecha_cierre',
    ],
    ordenesTrabajo.map((o) => [
      sqlStr(o.id), sqlStr(o.folio), sqlStr(o.naveId), sqlStr(o.sistemaCriticoId), sqlStr(o.categoria),
      sqlStr(o.descripcion), sqlStr(o.prioridad), sqlNum(o.slaHoras), sqlStr(o.contratistaId), sqlNum(o.costoEstimado),
      sqlStr(ESTATUS_ORDEN_A_ESTATUS[o.estatus] ?? o.estatus), sqlStr(o.fechaCreacion), sqlStr(o.fechaCompromiso), sqlStr(o.fechaCierre),
    ])
  )
)

// tareas_operativas
lines.push(
  insertStatement(
    'tareas_operativas',
    ['id', 'categoria', 'titulo', 'nave_id', 'responsable', 'columna', 'costo_estimado', 'avance_pct', 'cotizaciones_recibidas', 'sla_restante_horas'],
    tareasOperativas.map((t) => [
      sqlStr(t.id), sqlStr(t.categoria), sqlStr(t.titulo), sqlStr(t.naveId), sqlStr(t.responsable), sqlStr(t.columna),
      sqlNum(t.costoEstimado), sqlNum(t.avancePct), sqlStr(t.cotizacionesRecibidas), sqlNum(t.slaRestanteHoras),
    ])
  )
)

// proyectos_capex
lines.push(
  insertStatement(
    'proyectos_capex',
    [
      'id', 'codigo', 'nave_id', 'titulo', 'justificacion_tecnica', 'inversion_estimada', 'roi_proyectado_pct',
      'payback_anios', 'estatus_comite', 'proveedor_seleccionado', 'avance_fisico_pct', 'avance_financiero_pct',
    ],
    proyectosCapex.map((p) => [
      sqlStr(p.id), sqlStr(p.codigo), sqlStr(p.naveId), sqlStr(p.titulo), sqlStr(p.justificacionTecnica),
      sqlNum(p.inversionEstimada), sqlNum(p.roiProyectadoPct), sqlNum(p.paybackAnios), sqlStr(p.estatusComite),
      sqlStr(p.proveedorSeleccionado), sqlNum(p.avanceFisicoPct), sqlNum(p.avanceFinancieroPct),
    ])
  )
)

// capex_cotizaciones (hijo de proyectos_capex, sin id propio en el modelo original -> se genera uuid)
{
  const rows = proyectosCapex.flatMap((p) =>
    p.cotizaciones.map((c) => [sqlStr(p.id), sqlStr(c.proveedor), sqlNum(c.monto), sqlNum(c.garantiaMeses), sqlBool(c.recibida)])
  )
  if (rows.length > 0) {
    const values = rows.map((r) => `  (${r.join(', ')})`).join(',\n')
    lines.push(`insert into capex_cotizaciones (proyecto_capex_id, proveedor, monto, garantia_meses, recibida) values\n${values};\n`)
  }
}

// solicitudes_cotizacion + solicitud_propuestas
lines.push(
  insertStatement(
    'solicitudes_cotizacion',
    ['id', 'folio', 'nave_id', 'titulo', 'dias_para_vencer'],
    solicitudesCotizacion.map((s) => [sqlStr(s.id), sqlStr(s.folio), sqlStr(s.naveId), sqlStr(s.titulo), sqlNum(s.diasParaVencer)])
  )
)
{
  const rows = solicitudesCotizacion.flatMap((s) =>
    s.propuestas.map((p) => [sqlStr(s.id), sqlStr(p.proveedor), sqlNum(p.precio), sqlNum(p.garantiaMeses), sqlBool(p.recibida), sqlBool(p.mejorOferta)])
  )
  if (rows.length > 0) {
    const values = rows.map((r) => `  (${r.join(', ')})`).join(',\n')
    lines.push(`insert into solicitud_propuestas (solicitud_id, proveedor, precio, garantia_meses, recibida, mejor_oferta) values\n${values};\n`)
  }
}

// propietarios_legales
lines.push(
  insertStatement(
    'propietarios_legales',
    ['nave_id', 'razon_social', 'rfc', 'regimen_propiedad', 'numero_escritura', 'notario', 'folio_rpp', 'gravamenes'],
    propietariosLegales.map((p) => [
      sqlStr(p.naveId), sqlStr(p.razonSocial), sqlStr(p.rfc), sqlStr(p.regimenPropiedad), sqlStr(p.numeroEscritura),
      sqlStr(p.notario), sqlStr(p.folioRPP), sqlStr(p.gravamenes),
    ])
  ).replace('on conflict (id)', 'on conflict (nave_id)')
)

// estudios_tecnicos
lines.push(
  insertStatement(
    'estudios_tecnicos',
    ['id', 'nave_id', 'tipo', 'empresa_consultora', 'fecha_realizacion', 'resultado', 'archivo_url'],
    estudiosTecnicos.map((e) => [
      sqlStr(e.id), sqlStr(e.naveId), sqlStr(e.tipo), sqlStr(e.empresaConsultora), sqlStr(e.fechaRealizacion),
      sqlStr(e.resultado), sqlStr(e.archivoUrl),
    ])
  )
)

// contactos_emergencia (PK compuesta nave_id+tipo, sin id)
{
  const rows = contactosEmergencia.map((c) => [sqlStr(c.naveId), sqlStr(c.tipo), sqlStr(c.nombre), sqlStr(c.telefono)])
  if (rows.length > 0) {
    const values = rows.map((r) => `  (${r.join(', ')})`).join(',\n')
    lines.push(`insert into contactos_emergencia (nave_id, tipo, nombre, telefono) values\n${values}\non conflict (nave_id, tipo) do nothing;\n`)
  }
}

// eventos_calendario
lines.push(
  insertStatement(
    'eventos_calendario',
    ['id', 'dia', 'tipo', 'hora', 'descripcion', 'responsable', 'nave_id'],
    eventosCalendario.map((e) => [sqlStr(e.id), sqlNum(e.dia), sqlStr(e.tipo), sqlStr(e.hora), sqlStr(e.descripcion), sqlStr(e.responsable), sqlStr(e.naveId)])
  )
)

// matriz_confiabilidad
lines.push(
  insertStatement(
    'matriz_confiabilidad',
    ['id', 'sistema', 'codigo_referencia', 'descripcion_intervencion', 'indicador', 'estatus_salud'],
    matrizConfiabilidad.map((m) => [sqlStr(m.id), sqlStr(m.sistema), sqlStr(m.codigoReferencia), sqlStr(m.descripcionIntervencion), sqlStr(m.indicador), sqlStr(m.estatusSalud)])
  )
)

const outPath = resolve(__dirname, '../supabase/seed/seed.sql')
writeFileSync(outPath, lines.join('\n'), 'utf-8')
console.log(`Seed SQL escrito en ${outPath}`)
