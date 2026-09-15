import type { ProfileRow } from '@/context/AuthContext'

export type Rol = ProfileRow['rol']

// Matriz de permisos — sección 4 del prompt de referencia (DMI-0E2EE313).
// Property Manager y Facility Manager capturan operación en su ámbito; Dirección y
// Contabilidad solo aprueban/consultan; Administrador del Sistema administra catálogos
// y usuarios pero nunca edita expedientes ni ve documentos legales/contractuales.
//
// Superadministrador (Fase 6n) es una capa por encima de esta matriz: acceso total sin
// restricción de rol ni de región, a petición explícita del usuario. Cada función de
// abajo agrega `|| esSuperAdministrador(rol)` en vez de tener un caso especial en cada
// pantalla — la misma regla mecánica se refleja en las policies de RLS (0013).
export const esSuperAdministrador = (rol: Rol) => rol === 'Superadministrador'

export const puedeAltaNave = (rol: Rol) => rol === 'Property Manager' || esSuperAdministrador(rol)
export const puedeEditarNave = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager' || esSuperAdministrador(rol)

// Contratos y sus anexos: acceso restringido, nunca los consulta el Facility Manager
// ni el Administrador del Sistema (regla transversal 4.6).
export const puedeVerContrato = (rol: Rol) => (rol !== 'Facility Manager' && rol !== 'Administrador del Sistema') || esSuperAdministrador(rol)
export const puedeEditarContrato = (rol: Rol) => rol === 'Property Manager' || esSuperAdministrador(rol)
export const puedeResolverRenovacion = (rol: Rol) => rol === 'Dirección' || esSuperAdministrador(rol)

// Documentos de Obra & Construcción (licencias, MIA, protección civil, memoria de
// cálculo): PM y FM cargan/validan según el tipo.
export const puedeEditarDocumentoObra = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager' || esSuperAdministrador(rol)

// Predial / CFE / Agua / Licencia Ambiental: Contabilidad tiene la autoridad final,
// PM puede cargar/corregir; Facility Manager solo consulta (4.2).
export const puedeEditarDocumentoPredialCfe = (rol: Rol) => rol === 'Property Manager' || rol === 'Contabilidad' || esSuperAdministrador(rol)

export const puedeEditarOrden = (rol: Rol) => rol === 'Facility Manager' || esSuperAdministrador(rol)
export const puedeValidarCierreOrden = (rol: Rol) => rol === 'Facility Manager' || esSuperAdministrador(rol)
export const puedeEditarTarea = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager' || esSuperAdministrador(rol)
export const puedeEditarCapex = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager' || esSuperAdministrador(rol)

// Comité de CapEx: Dirección vota y resuelve (aprueba/rechaza) proyectos en revisión;
// PM/FM preparan la ficha y las cotizaciones pero no deciden el resultado del comité.
export const puedeVotarCapex = (rol: Rol) => rol === 'Dirección' || esSuperAdministrador(rol)
export const puedeResolverCapex = (rol: Rol) => rol === 'Dirección' || esSuperAdministrador(rol)

export const esAdministrador = (rol: Rol) => rol === 'Administrador del Sistema' || esSuperAdministrador(rol)

// Bitácora de auditoría: solo quienes supervisan el sistema en conjunto, no quienes
// operan un ámbito específico (4.6 — visibilidad transversal reservada a Dirección/Admin).
export const puedeVerBitacora = (rol: Rol) => rol === 'Administrador del Sistema' || rol === 'Dirección' || esSuperAdministrador(rol)
