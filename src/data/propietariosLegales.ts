import type { PropietarioLegal } from './types'
import { naves } from './naves'
import { parqueById } from './parques'

// Naves con gravamen hipotecario activo (financiamiento de adquisición/construcción).
const CON_GRAVAMEN: Record<string, string> = {
  'NAVE-06': 'Hipoteca en primer lugar a favor de Banco Actinver, S.A. — crédito de construcción, saldo vigente',
  'NAVE-08': 'Hipoteca en primer lugar a favor de BBVA México, S.A. — crédito estructurado BTS',
}

const NOTARIOS_POR_ESTADO: Record<string, string> = {
  Jalisco: 'Lic. Ricardo Peña Solórzano — Notaría Pública No. 14, Guadalajara, Jalisco',
  Querétaro: 'Lic. Marcela Rentería Ibarra — Notaría Pública No. 7, Querétaro, Qro.',
  'Nuevo León': 'Lic. Fernando Cantú Villarreal — Notaría Pública No. 22, Monterrey, N.L.',
  Guanajuato: 'Lic. Beatriz Landeros Amaro — Notaría Pública No. 5, León, Gto.',
  Coahuila: 'Lic. Sergio Elizondo Faz — Notaría Pública No. 11, Saltillo, Coah.',
  'San Luis Potosí': 'Lic. Adriana Torres Medina — Notaría Pública No. 9, San Luis Potosí, S.L.P.',
  Aguascalientes: 'Lic. Rodolfo Salas Núñez — Notaría Pública No. 4, Aguascalientes, Ags.',
  Chihuahua: 'Lic. Karla Domínguez Ríos — Notaría Pública No. 6, Ciudad Juárez, Chih.',
  Tamaulipas: 'Lic. Hugo Barrientos Cepeda — Notaría Pública No. 3, Reynosa, Tamps.',
}

export const propietariosLegales: PropietarioLegal[] = naves.map((nave, idx) => {
  const parque = parqueById(nave.parqueId)!
  return {
    naveId: nave.id,
    razonSocial: 'Grupo DMI Industrial, Fideicomiso Inmobiliario F/1847 (Banco Actinver, S.A., Institución de Banca Múltiple, Grupo Financiero Actinver)',
    rfc: 'GDI081204XY1',
    regimenPropiedad: 'Fideicomiso Inmobiliario',
    numeroEscritura: `${28400 + idx * 37}`,
    notario: NOTARIOS_POR_ESTADO[parque.estado] ?? `Notaría Pública de ${parque.estado}`,
    folioRPP: `RPP-${parque.estado.slice(0, 3).toUpperCase()}-${100000 + idx * 211}`,
    gravamenes: CON_GRAVAMEN[nave.id] ?? null,
  }
})

export const propietarioPorNave = (naveId: string) => propietariosLegales.find((p) => p.naveId === naveId)
