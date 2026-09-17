// Fase 7a (Subfase 4/4): roles y permisos viven en las tablas `roles`/`permisos_por_rol`
// (migraciones 0019/0020) en vez de una unión fija de TypeScript + comparaciones de string
// hardcodeadas — cualquier rol nuevo creado desde /admin/roles funciona aquí sin tocar
// código. `Rol` deja de ser una unión literal porque los roles ahora son verdaderamente
// dinámicos (se pierde el autocompletado de los 6 roles originales a cambio).
//
// Superadministrador (Fase 6n) sigue siendo una capa por encima de la matriz —
// bypass total, sin caso especial por pantalla — igual que antes. Administrador del
// Sistema/Superadministrador (esAdministrador) también se quedan como comparación directa
// de rol: son las dos identidades "raíz" que administran el propio catálogo de permisos, y
// no pueden depender de la tabla que ellas mismas administran (mismo criterio que
// es_administrador_del_sistema() en SQL, que tampoco se movió a permisos_por_rol).
export type Rol = string

export const esSuperAdministrador = (rol: Rol) => rol === 'Superadministrador'
export const esAdministrador = (rol: Rol) => rol === 'Administrador del Sistema' || esSuperAdministrador(rol)

// Valor por defecto = la matriz hardcodeada que existía antes de esta fase, para que el
// comportamiento no cambie ni un instante mientras DataStoreContext todavía no termina de
// pedir `permisos_por_rol` a Supabase (mismo patrón ya usado en Fase 7a/6v: sembrar con el
// valor literal actual, sobrescribir una sola vez con el dato real).
let permisosPorRolActual: Record<string, Set<string>> = {
  'Property Manager': new Set([
    'alta_nave',
    'editar_nave',
    'escribir_orden',
    'editar_tarea',
    'ver_contrato',
    'editar_contrato',
    'editar_documento_obra',
    'editar_documento_predial_cfe',
    'editar_capex',
  ]),
  'Facility Manager': new Set(['editar_nave', 'escribir_orden', 'editar_orden', 'validar_cierre_orden', 'editar_tarea', 'editar_documento_obra', 'editar_capex']),
  Dirección: new Set(['ver_contrato', 'resolver_renovacion', 'resolver_capex', 'votar_capex', 'ver_bitacora']),
  Contabilidad: new Set(['ver_contrato', 'editar_documento_predial_cfe']),
  'Administrador del Sistema': new Set(['ver_bitacora']),
  Superadministrador: new Set(),
}

// Llamado una sola vez por DataStoreContext cuando resuelve el fetch real de permisos_por_rol.
export function _establecerPermisosPorRol(mapa: Record<string, Set<string>>) {
  permisosPorRolActual = mapa
}

const tiene = (rol: Rol, permiso: string) => esSuperAdministrador(rol) || (permisosPorRolActual[rol]?.has(permiso) ?? false)

export const puedeAltaNave = (rol: Rol) => tiene(rol, 'alta_nave')
export const puedeEditarNave = (rol: Rol) => tiene(rol, 'editar_nave')

export const puedeVerContrato = (rol: Rol) => tiene(rol, 'ver_contrato')
export const puedeEditarContrato = (rol: Rol) => tiene(rol, 'editar_contrato')
export const puedeResolverRenovacion = (rol: Rol) => tiene(rol, 'resolver_renovacion')

export const puedeEditarDocumentoObra = (rol: Rol) => tiene(rol, 'editar_documento_obra')
export const puedeEditarDocumentoPredialCfe = (rol: Rol) => tiene(rol, 'editar_documento_predial_cfe')

export const puedeCrearOrden = (rol: Rol) => tiene(rol, 'escribir_orden')
export const puedeEditarOrden = (rol: Rol) => tiene(rol, 'editar_orden')
export const puedeValidarCierreOrden = (rol: Rol) => tiene(rol, 'validar_cierre_orden')
export const puedeEditarTarea = (rol: Rol) => tiene(rol, 'editar_tarea')
export const puedeEditarCapex = (rol: Rol) => tiene(rol, 'editar_capex')

export const puedeVotarCapex = (rol: Rol) => tiene(rol, 'votar_capex')
export const puedeResolverCapex = (rol: Rol) => tiene(rol, 'resolver_capex')

export const puedeVerBitacora = (rol: Rol) => tiene(rol, 'ver_bitacora')

// Catálogo de permisos para la matriz de /admin/roles — mismo orden y agrupación que la
// tabla del plan. `soloRls` marca permisos que hoy solo existen a nivel de base de datos,
// sin botón/diálogo propio en el cliente.
export const CATALOGO_PERMISOS: { clave: string; etiqueta: string; soloRls?: boolean }[] = [
  { clave: 'alta_nave', etiqueta: 'Dar de alta naves' },
  { clave: 'editar_nave', etiqueta: 'Editar naves' },
  { clave: 'escribir_orden', etiqueta: 'Crear órdenes de trabajo' },
  { clave: 'editar_orden', etiqueta: 'Editar órdenes de trabajo' },
  { clave: 'validar_cierre_orden', etiqueta: 'Validar cierre de órdenes' },
  { clave: 'editar_tarea', etiqueta: 'Editar tareas operativas' },
  { clave: 'ver_contrato', etiqueta: 'Ver contratos de arrendamiento' },
  { clave: 'editar_contrato', etiqueta: 'Editar contratos de arrendamiento' },
  { clave: 'resolver_renovacion', etiqueta: 'Resolver renovaciones de contrato' },
  { clave: 'editar_documento_obra', etiqueta: 'Editar documentos de Obra & Construcción' },
  { clave: 'editar_documento_predial_cfe', etiqueta: 'Editar documentos de Predial/CFE/Ambiental' },
  { clave: 'editar_capex', etiqueta: 'Editar proyectos CapEx' },
  { clave: 'resolver_capex', etiqueta: 'Resolver (aprobar/rechazar) proyectos CapEx' },
  { clave: 'votar_capex', etiqueta: 'Votar en comité de CapEx' },
  { clave: 'ver_bitacora', etiqueta: 'Ver bitácora del sistema' },
]
