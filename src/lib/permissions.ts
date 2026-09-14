import type { ProfileRow } from '@/context/AuthContext'

export type Rol = ProfileRow['rol']

// Matriz de permisos — sección 4 del prompt de referencia (DMI-0E2EE313).
// Property Manager y Facility Manager capturan operación en su ámbito; Dirección y
// Contabilidad solo aprueban/consultan; Administrador del Sistema administra catálogos
// y usuarios pero nunca edita expedientes ni ve documentos legales/contractuales.

export const puedeAltaNave = (rol: Rol) => rol === 'Property Manager'
export const puedeEditarNave = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager'

// Contratos y sus anexos: acceso restringido, nunca los consulta el Facility Manager
// ni el Administrador del Sistema (regla transversal 4.6).
export const puedeVerContrato = (rol: Rol) => rol !== 'Facility Manager' && rol !== 'Administrador del Sistema'
export const puedeEditarContrato = (rol: Rol) => rol === 'Property Manager'
export const puedeResolverRenovacion = (rol: Rol) => rol === 'Dirección'

// Documentos de Obra & Construcción (licencias, MIA, protección civil, memoria de
// cálculo): PM y FM cargan/validan según el tipo.
export const puedeEditarDocumentoObra = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager'

// Predial / CFE / Agua / Licencia Ambiental: Contabilidad tiene la autoridad final,
// PM puede cargar/corregir; Facility Manager solo consulta (4.2).
export const puedeEditarDocumentoPredialCfe = (rol: Rol) => rol === 'Property Manager' || rol === 'Contabilidad'

export const puedeEditarOrden = (rol: Rol) => rol === 'Facility Manager'
export const puedeValidarCierreOrden = (rol: Rol) => rol === 'Facility Manager'
export const puedeEditarTarea = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager'
export const puedeEditarCapex = (rol: Rol) => rol === 'Property Manager' || rol === 'Facility Manager'

export const esAdministrador = (rol: Rol) => rol === 'Administrador del Sistema'
