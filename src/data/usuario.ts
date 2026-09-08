import type { Usuario } from './types'

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
  'Ing. Tomás Guerrero — Facility Manager',
] as const

export type Responsable = (typeof equipoInterno)[number]
