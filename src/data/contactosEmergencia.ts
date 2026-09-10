import type { ContactoEmergencia } from './types'
import { naves } from './naves'
import { parqueById } from './parques'

function telefonoLocal(base: number, idx: number) {
  const linea = (base + idx * 7) % 10000
  return `+52 ${800 + (idx % 200)} ${String(linea).padStart(4, '0')} 000`
}

export const contactosEmergencia: ContactoEmergencia[] = naves.flatMap((nave, idx) => {
  const parque = parqueById(nave.parqueId)!
  return [
    { naveId: nave.id, tipo: 'Bomberos', nombre: `Heroico Cuerpo de Bomberos de ${parque.ciudad}`, telefono: telefonoLocal(1120, idx) },
    { naveId: nave.id, tipo: 'Cruz Roja / Ambulancia', nombre: `Cruz Roja Mexicana — Delegación ${parque.ciudad}`, telefono: telefonoLocal(2065, idx) },
    { naveId: nave.id, tipo: 'Protección Civil Municipal', nombre: `Protección Civil Municipal de ${parque.ciudad}`, telefono: telefonoLocal(3410, idx) },
    { naveId: nave.id, tipo: 'Seguridad Privada 24/7', nombre: 'Grupo de Vigilancia Industrial Centinela, S.A. de C.V.', telefono: telefonoLocal(4550, idx) },
  ] satisfies ContactoEmergencia[]
})

export const contactosEmergenciaPorNave = (naveId: string) => contactosEmergencia.filter((c) => c.naveId === naveId)
