import type { Region, Usuario } from './types'

export const usuarioActual: Usuario = {
  nombre: 'Ing. Arq. Rodrigo M.',
  puesto: 'Director de Operaciones',
  rol: 'Dirección',
  navesAsignadas: 'todas',
  avatarIniciales: 'RM',
}

// Equipo interno de Property/Facility Management referenciado como responsable
// en alertas, tareas del Kanban y órdenes de trabajo — mismo roster en toda la app.
export const equipoInterno = [
  'Ing. Arq. Rodrigo M. — Director de Operaciones',
  'Ing. Paola Reséndiz — PM Regional Bajío',
  'Ing. Diego Salcedo — PM Regional Norte',
  'Arq. Mariana Cobos — PM Regional Occidente',
  'Lic. Andrés Villalpando — Coordinador Legal & Cumplimiento',
  'C.P. Renata Solís — Coordinadora de Cobranza CAM',
  'Ing. Tomás Guerrero — Facility Manager Regional Norte',
  'Ing. Lorena Ibáñez Cárdenas — Facility Manager Regional Bajío',
  'Ing. Héctor Villaseñor Prado — Facility Manager Regional Occidente',
] as const

export type Responsable = (typeof equipoInterno)[number]

export const PM_POR_REGION: Record<Region, Responsable> = {
  Bajío: 'Ing. Paola Reséndiz — PM Regional Bajío',
  Norte: 'Ing. Diego Salcedo — PM Regional Norte',
  Occidente: 'Arq. Mariana Cobos — PM Regional Occidente',
}

export const FACILITY_MANAGER_POR_REGION: Record<Region, Responsable> = {
  Bajío: 'Ing. Lorena Ibáñez Cárdenas — Facility Manager Regional Bajío',
  Norte: 'Ing. Tomás Guerrero — Facility Manager Regional Norte',
  Occidente: 'Ing. Héctor Villaseñor Prado — Facility Manager Regional Occidente',
}
