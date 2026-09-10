import type { EstudioTecnico, TipoEstudioTecnico } from './types'
import { naves } from './naves'
import { addDays } from '../lib/dates'

interface Plantilla {
  tipo: TipoEstudioTecnico
  empresa: string
  offsetDias: number // relativo a fechaEntrega
  resultado: string
}

const PLANTILLAS: Plantilla[] = [
  {
    tipo: 'Mecánica de Suelos',
    empresa: 'Geotecnia Aplicada del Bajío, S.C.',
    offsetDias: -180,
    resultado: 'Capacidad de carga admisible verificada — apta para cimentación superficial',
  },
  {
    tipo: 'Estudio Topográfico',
    empresa: 'Levantamientos Geoespaciales Norte, S.A. de C.V.',
    offsetDias: -170,
    resultado: 'Polígono y niveles verificados contra escritura — sin invasiones ni afectaciones',
  },
  {
    tipo: 'Ambiental Fase I',
    empresa: 'Consultores Ambientales Industriales, S.C.',
    offsetDias: -150,
    resultado: 'Sin evidencia de pasivo ambiental — recomendación: sin acciones adicionales',
  },
  {
    tipo: 'PCA (Property Condition Assessment)',
    empresa: 'Building Diligence Partners México',
    offsetDias: 30,
    resultado: 'Condición física conforme a lo proyectado — sin hallazgos mayores al cierre de obra',
  },
]

let contador = 0
function nextId() {
  contador += 1
  return `EST-${String(contador).padStart(4, '0')}`
}

export const estudiosTecnicos: EstudioTecnico[] = naves.flatMap((nave) =>
  PLANTILLAS.map((p) => ({
    id: nextId(),
    naveId: nave.id,
    tipo: p.tipo,
    empresaConsultora: p.empresa,
    fechaRealizacion: addDays(nave.fechaEntrega, p.offsetDias),
    resultado: p.resultado,
    archivoUrl: `/dossier/${nave.id}/${p.tipo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
  } satisfies EstudioTecnico)),
)

export const estudiosPorNave = (naveId: string) => estudiosTecnicos.filter((e) => e.naveId === naveId)
