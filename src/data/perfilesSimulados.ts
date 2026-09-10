import type { Region } from './types'

export type ClavePerfil = 'direccion' | 'pm-bajio' | 'pm-norte' | 'pm-occidente' | 'contabilidad'

export interface PerfilSimulado {
  clave: ClavePerfil
  nombre: string
  puesto: string
  rol: 'Dirección' | 'Property Manager' | 'Contabilidad'
  region: Region | 'todas'
  iniciales: string
}

// Catálogo de perfiles que el usuario puede simular desde la barra superior,
// para demostrar en la maqueta la restricción de acceso por región y por rol
// sin necesidad de autenticación real.
export const perfilesSimulados: PerfilSimulado[] = [
  { clave: 'direccion', nombre: 'Ing. Arq. Rodrigo M.', puesto: 'Director de Operaciones', rol: 'Dirección', region: 'todas', iniciales: 'RM' },
  { clave: 'pm-bajio', nombre: 'Ing. Paola Reséndiz', puesto: 'PM Regional Bajío', rol: 'Property Manager', region: 'Bajío', iniciales: 'PR' },
  { clave: 'pm-norte', nombre: 'Ing. Diego Salcedo', puesto: 'PM Regional Norte', rol: 'Property Manager', region: 'Norte', iniciales: 'DS' },
  { clave: 'pm-occidente', nombre: 'Arq. Mariana Cobos', puesto: 'PM Regional Occidente', rol: 'Property Manager', region: 'Occidente', iniciales: 'MC' },
  { clave: 'contabilidad', nombre: 'C.P. Ignacio Ferreira Luna', puesto: 'Contabilidad', rol: 'Contabilidad', region: 'todas', iniciales: 'IF' },
]

export const perfilPorClave = (clave: ClavePerfil) => perfilesSimulados.find((p) => p.clave === clave)!
