import type { Broker, Region } from './types'
import { naves } from './naves'
import { parqueById } from './parques'

export const brokers: Broker[] = [
  { id: 'BRK-01', nombre: 'Ing. Fabiola Nájera Cortés', inmobiliaria: 'Colliers Industrial México', telefono: '+52 33 3817 4420', email: 'fnajera@colliers-industrial.mx' },
  { id: 'BRK-02', nombre: 'Lic. Emiliano Sandoval Reyes', inmobiliaria: 'CBRE Industrial & Logistics', telefono: '+52 81 8399 2210', email: 'esandoval@cbre-industrial.mx' },
  { id: 'BRK-03', nombre: 'Lic. Daniela Ochoa Tapia', inmobiliaria: 'Cushman & Wakefield Bajío', telefono: '+52 442 213 8850', email: 'dochoa@cw-bajio.mx' },
]

const BROKER_POR_REGION: Record<Region, string> = {
  Occidente: 'BRK-01',
  Norte: 'BRK-02',
  Bajío: 'BRK-03',
}

export const brokerById = (id: string) => brokers.find((b) => b.id === id)

export const brokerPorNaveId: Record<string, string> = Object.fromEntries(
  naves.map((n) => [n.id, BROKER_POR_REGION[parqueById(n.parqueId)!.region]]),
)
