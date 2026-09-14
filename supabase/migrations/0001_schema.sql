-- DMI Industrial — Property Management Platform (Folio DMI-0E2EE313)
-- Fase 6a v2: esquema de base de datos alineado al MVP productivo real
-- (autenticación real, permisos por rol y ámbito, documentos versionados,
-- bitácora persistente, flujos de aprobación — ver prompt de referencia).
-- Ejecutar en el SQL Editor de Supabase, en este proyecto, una sola vez.

create extension if not exists "pgcrypto";

-- =========================================================
-- Catálogos generales y parámetros de negocio
-- =========================================================

create table calendario_dias_festivos (
  fecha date primary key,
  descripcion text not null
);

create table parametros_configurables (
  clave text primary key,
  valor jsonb not null,
  descripcion text,
  actualizado_en timestamptz not null default now()
);

-- Catálogo maestro fijo de 12 sistemas críticos de mantenimiento (sección 6.6 del prompt).
create table catalogo_sistemas_criticos (
  id text primary key,
  nombre text not null,
  frecuencia text not null check (frecuencia in ('Mensual', 'Quincenal', 'Trimestral', 'Semestral', 'Anual')),
  ventana_proximo_dias integer not null,
  ventana_critico_dias integer not null,
  prioridad text not null check (prioridad in ('Alta', 'Media', 'Baja'))
);

insert into catalogo_sistemas_criticos (id, nombre, frecuencia, ventana_proximo_dias, ventana_critico_dias, prioridad) values
  ('SC-01', 'Red Contra Incendio y Bombas (SCI)', 'Anual', 30, 10, 'Alta'),
  ('SC-02', 'Subestación y Transformadores', 'Anual', 30, 10, 'Alta'),
  ('SC-03', 'Planta de Emergencia (Generador)', 'Mensual', 20, 5, 'Alta'),
  ('SC-04', 'Protección Civil', 'Anual', 30, 10, 'Alta'),
  ('SC-05', 'HVAC', 'Trimestral', 20, 10, 'Media'),
  ('SC-06', 'Hidrosanitario y Cisternas', 'Semestral', 30, 7, 'Media'),
  ('SC-07', 'Andenes y Portones (Puertas y Rampas)', 'Semestral', 20, 7, 'Media'),
  ('SC-08', 'PTAR / Cárcamo', 'Mensual', 30, 7, 'Media'),
  ('SC-09', 'Paneles Solares / Inversores', 'Semestral', 30, 7, 'Media'),
  ('SC-10', 'Techumbre e Impermeabilización', 'Anual', 30, 7, 'Baja'),
  ('SC-11', 'Pavimentos y Áreas Exteriores', 'Anual', 30, 7, 'Baja'),
  ('SC-12', 'Áreas Verdes / Jardinería Exterior', 'Quincenal', 30, 7, 'Baja');

-- =========================================================
-- Identidad y ámbito de usuarios internos
-- =========================================================
-- id = auth.users.id. En Fase 6b arranca con Supabase Auth (correo/contraseña) como
-- placeholder; se migra a Microsoft Entra ID (SSO @grupodmi.com.mx) cuando TI de DMI
-- entregue el App Registration de Azure AD, sin tocar este esquema.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text not null unique,
  puesto text not null,
  rol text not null check (rol in ('Property Manager', 'Facility Manager', 'Dirección', 'Contabilidad', 'Administrador del Sistema')),
  ambito_regiones text[] not null default '{}',
  ambito_parques text[] not null default '{}',
  ambito_naves text[] not null default '{}',
  acceso_total boolean not null default false,
  activo boolean not null default true,
  avatar_iniciales text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Catálogos base del portafolio
-- =========================================================

create table parques (
  id text primary key,
  nombre text not null,
  region text not null check (region in ('Bajío', 'Norte', 'Occidente')),
  municipio text not null,
  estado text not null,
  superficie_total_m2 numeric,
  corredor_industrial text
);

create table brokers (
  id text primary key,
  nombre text not null,
  inmobiliaria text not null,
  telefono text not null,
  email text not null
);

create table contratistas (
  id text primary key,
  nombre text not null,
  especialidades text[] not null default '{}',
  regiones_atendidas text[] not null default '{}',
  calificacion numeric not null,
  poliza_rc text not null check (poliza_rc in ('Vigente', 'Por Vencer', 'Vencida')),
  trabajos_del_ano integer not null,
  porcentaje_on_time numeric not null
);

create table inquilinos (
  id text primary key,
  razon_social text not null,
  nombre_comercial text not null,
  industria text not null check (industria in ('Manufactura Avanzada', 'Logística & E-commerce', 'Automotriz & Tier 1', 'Otros')),
  representante_legal jsonb not null,
  plant_manager jsonb not null,
  contacto_mantenimiento jsonb not null,
  contacto_cxp jsonb not null
);

-- =========================================================
-- Nave (entidad central)
-- =========================================================

create table naves (
  id text primary key,
  folio text not null unique,
  parque_id text not null references parques(id),
  broker_id text references brokers(id),
  numero_nave text not null,
  direccion text not null,
  lat numeric not null,
  lng numeric not null,
  tipo_propiedad text not null check (tipo_propiedad in ('Nave Industrial', 'Bodega Logística', 'Terreno', 'Nave BTS')),
  clase_activo text not null check (clase_activo in ('Clase A', 'Clase B')),
  estatus_operativo text not null check (estatus_operativo in ('Óptimo Operativo', 'Alerta Predial Pendiente', 'En Renovación Formal', 'Mant. Preventivo HVAC', 'En Mora')),
  superficie_terreno numeric not null,
  superficie_construccion numeric not null,
  gla numeric not null,
  area_oficinas numeric not null,
  altura_libre numeric not null,
  numero_andenes integer not null,
  numero_rampas integer not null,
  capacidad_electrica numeric not null,
  piso_fffl text not null,
  bahia_columnas text not null,
  uso_de_suelo text not null,
  sistema_constructivo text not null,
  numero_cajones_estacionamiento integer not null,
  tipo_iluminacion text not null,
  certificacion_leed text check (certificacion_leed in ('LEED Gold', 'LEED Silver', 'LEED Platinum')),
  certificacion_esg boolean not null default false,
  cumplimiento_stps numeric not null,
  ocupada boolean not null default false,
  fecha_entrega date not null,
  responsable_operativo_id uuid references profiles(id),
  estado_alta text not null default 'Activo' check (estado_alta in ('Pendiente de Autorización', 'Activo', 'Inactivo')),
  estado_expediente text not null default 'Expediente Incompleto' check (estado_expediente in ('Expediente Incompleto', 'Expediente Validado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on naves (parque_id);
create index on naves (responsable_operativo_id);

-- =========================================================
-- Documentos / Permisos — máquina de estados + versionado (sección 6.2)
-- =========================================================

create table documentos (
  id text primary key,
  nave_id text not null references naves(id) on delete cascade,
  tipo text not null check (tipo in (
    'Licencia de Construcción', 'Manifestación de Impacto Ambiental', 'Dictamen de Protección Civil',
    'Memoria de Cálculo Estructural', 'Póliza de Responsabilidad Civil', 'Póliza Multirriesgo Industrial',
    'Predial', 'Contrato CFE', 'Contrato de Agua y Drenaje', 'Licencia Ambiental Estatal'
  )),
  requiere_vigencia boolean not null default true,
  dependencia_emisora text not null,
  numero_folio text not null,
  fecha_emision date not null,
  fecha_vencimiento date,
  estatus text not null default 'Pendiente' check (estatus in (
    'Pendiente', 'En Revisión', 'Aprobado/Vigente', 'Rechazado', 'Aprobado por Excepción', 'En Mora'
  )),
  motivo_rechazo text,
  archivo_url text,
  archivo_path text,
  creado_por uuid references profiles(id),
  aprobado_por uuid references profiles(id),
  fecha_aprobacion timestamptz,
  updated_at timestamptz not null default now()
);

create index on documentos (nave_id);

create table documento_versiones (
  id uuid primary key default gen_random_uuid(),
  documento_id text not null references documentos(id) on delete cascade,
  version integer not null,
  archivo_path text,
  archivo_url text,
  subido_por uuid references profiles(id),
  subido_en timestamptz not null default now(),
  comentario text
);

create index on documento_versiones (documento_id);

create table documento_excepciones (
  id uuid primary key default gen_random_uuid(),
  documento_id text not null references documentos(id) on delete cascade,
  motivo text not null,
  evidencia_path text,
  fecha_compromiso date,
  autorizado_por uuid references profiles(id),
  fecha_autorizacion timestamptz not null default now()
);

-- Extensión 1:1 de documentos tipo Póliza — mismo ciclo de vida, campos propios del ramo.
create table polizas (
  documento_id text primary key references documentos(id) on delete cascade,
  aseguradora text,
  numero_poliza text,
  cobertura text,
  suma_asegurada numeric
);

-- Extensión 1:1 de documentos tipo Predial.
create table predial (
  documento_id text primary key references documentos(id) on delete cascade,
  cuenta_predial text,
  ejercicio_fiscal integer,
  importe numeric,
  fecha_limite_pago date,
  estatus_pago text
);

-- =========================================================
-- Contratos de arrendamiento y renovación (sección 6.4)
-- =========================================================

create table contratos (
  id text primary key,
  nave_id text not null references naves(id) on delete cascade,
  inquilino_id text not null references inquilinos(id),
  fecha_inicio date not null,
  fecha_entrega date not null,
  fecha_vencimiento date not null,
  plazo_meses integer not null,
  moneda text not null default 'USD' check (moneda in ('USD', 'MXN')),
  renta_base_mensual numeric not null,
  tarifa_por_m2 numeric not null,
  cam numeric not null,
  deposito_garantia numeric not null,
  esquema_incremento text not null,
  opciones_renovacion text not null,
  tipo_contrato text not null check (tipo_contrato in ('Triple Net (NNN)', 'Doble Neto (NN)', 'Bruto Modificado')),
  avalista text not null,
  clausulas_especiales text[] not null default '{}',
  vigencia text not null default 'Vigente' check (vigencia in ('Vigente', 'Terminación Programada', 'Vencido', 'Terminado')),
  responsable_interno_id uuid references profiles(id),
  archivo_path text,
  archivo_url text,
  updated_at timestamptz not null default now()
);

create index on contratos (nave_id);

create table renovaciones (
  id uuid primary key default gen_random_uuid(),
  contrato_id text not null references contratos(id) on delete cascade,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'En Revisión', 'Pendiente de Firma', 'Aprobada', 'No Renovada')),
  terminos_propuestos jsonb,
  motivo_rechazo text,
  motivo_no_renovacion text,
  archivo_contrato_firmado_path text,
  fecha_apertura date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on renovaciones (contrato_id);

-- =========================================================
-- Mantenimiento — sistemas críticos por nave y órdenes de trabajo (secciones 6.6/6.7)
-- =========================================================

create table sistemas_criticos_nave (
  id text primary key,
  nave_id text not null references naves(id) on delete cascade,
  sistema_id text not null references catalogo_sistemas_criticos(id),
  codigo_referencia text not null,
  vendor text not null,
  costo_anual_estimado numeric not null,
  fecha_ultimo_mantenimiento date not null,
  fecha_proximo_mantenimiento date not null,
  indicador_salud text not null,
  estatus_salud text not null check (estatus_salud in ('Óptimo', 'Alerta', 'Crítico')),
  ultima_intervencion text not null
);

create index on sistemas_criticos_nave (nave_id);

create table ordenes_trabajo (
  id text primary key,
  folio text not null unique,
  nave_id text not null references naves(id) on delete cascade,
  sistema_critico_id text references sistemas_criticos_nave(id),
  tipo text not null default 'Correctivo' check (tipo in ('Preventivo', 'Correctivo')),
  orden_preventiva_relacionada_id text references ordenes_trabajo(id),
  categoria text not null,
  descripcion text not null,
  prioridad text not null check (prioridad in ('Crítica', 'Alta', 'Media', 'Baja')),
  sla_horas numeric not null,
  contratista_id text not null references contratistas(id),
  costo_estimado numeric not null,
  estatus text not null default 'Abierta' check (estatus in ('Abierta', 'En Proceso', 'Esperando Refacción', 'Pendiente de Evidencia', 'Validado', 'Cancelada')),
  motivo_cancelacion text,
  fecha_creacion date not null,
  fecha_compromiso date not null,
  fecha_cierre date,
  updated_at timestamptz not null default now()
);

create index on ordenes_trabajo (nave_id);

create table ordenes_pausas (
  id uuid primary key default gen_random_uuid(),
  orden_id text not null references ordenes_trabajo(id) on delete cascade,
  inicio timestamptz not null default now(),
  fin timestamptz,
  motivo text
);

create index on ordenes_pausas (orden_id);

create table ordenes_evidencia (
  id uuid primary key default gen_random_uuid(),
  orden_id text not null references ordenes_trabajo(id) on delete cascade,
  archivo_path text,
  autor_id uuid references profiles(id),
  fecha timestamptz not null default now(),
  resultado text not null default 'Pendiente' check (resultado in ('Pendiente', 'Aceptada', 'Rechazada')),
  motivo_rechazo text,
  retrabajo boolean,
  aprobador_id uuid references profiles(id),
  fecha_aprobacion timestamptz,
  comentario text
);

create index on ordenes_evidencia (orden_id);

-- =========================================================
-- Tareas operativas (Kanban, incluye Cobranza CAM) y flujo de firmas por importe (6.10/6.11)
-- =========================================================

create table tareas_operativas (
  id text primary key,
  categoria text not null check (categoria in (
    'Regulatorio Legal', 'CapEx Prioritario', 'Correctivo Inmediato', 'Preventivo',
    'Mantenimiento Mayor', 'Cobranza CAM', 'Sanidad Operativa'
  )),
  titulo text not null,
  nave_id text not null references naves(id) on delete cascade,
  responsable text not null,
  columna text not null check (columna in ('Por Iniciar', 'En Cotización', 'En Ejecución', 'Completado & Auditado')),
  cam_estado text check (cam_estado in ('Por Iniciar', 'En Proceso', 'Completado')),
  costo_estimado numeric,
  avance_pct numeric,
  cotizaciones_recibidas text,
  sla_restante_horas numeric,
  fecha_objetivo date,
  updated_at timestamptz not null default now()
);

create index on tareas_operativas (nave_id);

create table tareas_firmas (
  id uuid primary key default gen_random_uuid(),
  tarea_id text not null references tareas_operativas(id) on delete cascade,
  paso integer not null,
  aprobador_id uuid references profiles(id),
  estatus text not null default 'Pendiente' check (estatus in ('Pendiente', 'Aprobada', 'Rechazada')),
  comentario text,
  fecha timestamptz,
  cotizaciones_adjuntas jsonb
);

create index on tareas_firmas (tarea_id);

-- =========================================================
-- CapEx — comité con votos persistidos (sección 6.8)
-- =========================================================

create table proyectos_capex (
  id text primary key,
  codigo text not null unique,
  nave_id text not null references naves(id) on delete cascade,
  titulo text not null,
  justificacion_tecnica text not null,
  inversion_estimada numeric not null,
  roi_proyectado_pct numeric,
  payback_anios numeric,
  estatus_comite text not null default 'Pendiente 3ra Cotización' check (estatus_comite in (
    'Pendiente 3ra Cotización', 'En Revisión Comité', 'Aprobado por Dirección', 'En Ejecución', 'Concluido', 'Rechazado', 'Cancelado'
  )),
  motivo_rechazo text,
  correccion_destino text check (correccion_destino in ('Pendiente 3ra Cotización', 'En Revisión Comité')),
  proveedor_seleccionado text,
  avance_fisico_pct numeric not null default 0,
  avance_financiero_pct numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index on proyectos_capex (nave_id);

create table capex_cotizaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_capex_id text not null references proyectos_capex(id) on delete cascade,
  proveedor text not null,
  monto numeric not null,
  garantia_meses integer not null,
  recibida boolean not null default false
);

create index on capex_cotizaciones (proyecto_capex_id);

create table capex_votos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id text not null references proyectos_capex(id) on delete cascade,
  usuario_id uuid references profiles(id),
  sentido text not null check (sentido in ('A favor', 'En contra', 'Abstención')),
  comentario text,
  fecha timestamptz not null default now()
);

create index on capex_votos (proyecto_id);

-- =========================================================
-- RFP / Solicitudes de cotización (mantenimiento)
-- =========================================================

create table solicitudes_cotizacion (
  id text primary key,
  folio text not null,
  nave_id text not null references naves(id) on delete cascade,
  titulo text not null,
  dias_para_vencer integer
);

create table solicitud_propuestas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id text not null references solicitudes_cotizacion(id) on delete cascade,
  proveedor text not null,
  precio numeric not null,
  garantia_meses integer not null,
  recibida boolean not null default false,
  mejor_oferta boolean not null default false
);

create index on solicitud_propuestas (solicitud_id);

-- =========================================================
-- Expediente 360 — datos legales / técnicos / emergencia
-- =========================================================

create table propietarios_legales (
  nave_id text primary key references naves(id) on delete cascade,
  razon_social text not null,
  rfc text not null,
  regimen_propiedad text not null check (regimen_propiedad in ('Propiedad Privada', 'Copropiedad', 'Fideicomiso Inmobiliario')),
  numero_escritura text not null,
  notario text not null,
  folio_rpp text not null,
  gravamenes text
);

create table estudios_tecnicos (
  id text primary key,
  nave_id text not null references naves(id) on delete cascade,
  tipo text not null check (tipo in ('Mecánica de Suelos', 'Estudio Topográfico', 'Ambiental Fase I', 'PCA (Property Condition Assessment)')),
  empresa_consultora text not null,
  fecha_realizacion date not null,
  resultado text not null,
  archivo_url text,
  archivo_path text
);

create index on estudios_tecnicos (nave_id);

create table contactos_emergencia (
  nave_id text not null references naves(id) on delete cascade,
  tipo text not null check (tipo in ('Bomberos', 'Cruz Roja / Ambulancia', 'Protección Civil Municipal', 'Seguridad Privada 24/7')),
  nombre text not null,
  telefono text not null,
  primary key (nave_id, tipo)
);

-- =========================================================
-- Calendario y matriz de confiabilidad (agregados de portafolio)
-- =========================================================

create table eventos_calendario (
  id text primary key,
  dia integer not null,
  tipo text not null,
  hora text not null,
  descripcion text not null,
  responsable text not null,
  nave_id text not null references naves(id) on delete cascade
);

create table matriz_confiabilidad (
  id text primary key,
  sistema text not null,
  codigo_referencia text not null,
  descripcion_intervencion text not null,
  indicador text not null,
  estatus_salud text not null check (estatus_salud in ('Óptimo', 'Alerta', 'Crítico'))
);

-- =========================================================
-- Bitácora de auditoría y notificaciones (secciones 6.17 / 3)
-- =========================================================

create table bitacora (
  id uuid primary key default gen_random_uuid(),
  entidad text not null,
  entidad_id text not null,
  tipo_evento text not null,
  usuario_id uuid references profiles(id),
  fecha_hora timestamptz not null default now(),
  descripcion text not null
);

create index on bitacora (entidad, entidad_id);
create index on bitacora (fecha_hora);

create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  destinatario_id uuid references profiles(id),
  entidad_relacionada text,
  urgencia text check (urgencia in ('Programado', 'Garantía Legal', 'Crítico Inminente')),
  fecha_generacion timestamptz not null default now(),
  leida boolean not null default false
);

create index on notificaciones (destinatario_id, leida);

-- Nota: AlertaVencimiento y TareaViva se siguen calculando en el cliente a partir de
-- documentos/contratos/ordenes_trabajo (igual que en la maqueta), ahora alimentados con
-- datos reales de Supabase — no tienen tabla propia.
