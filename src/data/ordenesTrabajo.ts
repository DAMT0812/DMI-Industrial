import type { OrdenTrabajo, PrioridadTicket } from './types'
import { addDays } from '../lib/dates'

export const SLA_HORAS: Record<PrioridadTicket, number> = {
  Crítica: 4,
  Alta: 24,
  Media: 48,
  Baja: 72,
}

const HOY_ISO = '2026-09-08'

interface Seed {
  naveId: string
  sistemaCriticoId: string | null
  categoria: string
  descripcion: string
  prioridad: PrioridadTicket
  contratistaId: string
  costoEstimado: number
  estatus: OrdenTrabajo['estatus']
  creadaHaceDias: number
  cierraEnDias?: number // si aplica, define fechaCierre relativa a creación
}

const seeds: Seed[] = [
  { naveId: 'NAVE-02', sistemaCriticoId: null, categoria: 'Cubiertas y Techos', descripcion: 'Filtración activa en junta de dilatación, zona norte de la cubierta', prioridad: 'Crítica', contratistaId: 'CTA-04', costoEstimado: 145_000, estatus: 'Abierta', creadaHaceDias: 1 },
  { naveId: 'NAVE-07', sistemaCriticoId: null, categoria: 'HVAC', descripcion: 'Unidad manejadora #3 sin enfriamiento en zona de oficinas', prioridad: 'Alta', contratistaId: 'CTA-03', costoEstimado: 62_000, estatus: 'En ejecución', creadaHaceDias: 2 },
  { naveId: 'NAVE-19', sistemaCriticoId: null, categoria: 'HVAC', descripcion: 'Ruido excesivo y vibración en compresor principal de techo', prioridad: 'Alta', contratistaId: 'CTA-03', costoEstimado: 48_000, estatus: 'En ejecución', creadaHaceDias: 3 },
  { naveId: 'NAVE-06', sistemaCriticoId: null, categoria: 'Contra Incendio / SCI', descripcion: 'Presión estática por debajo de rango en red húmeda, ala este', prioridad: 'Alta', contratistaId: 'CTA-01', costoEstimado: 88_000, estatus: 'Abierta', creadaHaceDias: 1 },
  { naveId: 'NAVE-11', sistemaCriticoId: null, categoria: 'Andenes & Rampas', descripcion: 'Sello hidráulico dañado en niveladora del andén 6', prioridad: 'Media', contratistaId: 'CTA-06', costoEstimado: 31_000, estatus: 'Esperando Refacción', creadaHaceDias: 6 },
  { naveId: 'NAVE-13', sistemaCriticoId: null, categoria: 'Eléctrico & Subestación', descripcion: 'Disparo intermitente de interruptor principal de media tensión', prioridad: 'Crítica', contratistaId: 'CTA-02', costoEstimado: 210_000, estatus: 'Abierta', creadaHaceDias: 0 },
  { naveId: 'NAVE-15', sistemaCriticoId: null, categoria: 'Pisos Industriales', descripcion: 'Fisuras en losa de concreto por tráfico de montacargas, zona de picking', prioridad: 'Media', contratistaId: 'CTA-05', costoEstimado: 54_000, estatus: 'En ejecución', creadaHaceDias: 5 },
  { naveId: 'NAVE-17', sistemaCriticoId: null, categoria: 'Cubiertas y Techos', descripcion: 'Corrosión en canalones y bajantes pluviales', prioridad: 'Media', contratistaId: 'CTA-04', costoEstimado: 39_000, estatus: 'Abierta', creadaHaceDias: 4 },
  { naveId: 'NAVE-09', sistemaCriticoId: null, categoria: 'Planta de Emergencia', descripcion: 'Falla en arranque automático durante prueba mensual programada', prioridad: 'Alta', contratistaId: 'CTA-07', costoEstimado: 76_000, estatus: 'Esperando Refacción', creadaHaceDias: 8 },
  { naveId: 'NAVE-04', sistemaCriticoId: null, categoria: 'Andenes & Rampas', descripcion: 'Cortina de andén dañada por impacto de vehículo de carga', prioridad: 'Baja', contratistaId: 'CTA-06', costoEstimado: 18_000, estatus: 'En ejecución', creadaHaceDias: 3 },
  { naveId: 'NAVE-10', sistemaCriticoId: null, categoria: 'Eléctrico & Subestación', descripcion: 'Mantenimiento correctivo de banco de capacitores', prioridad: 'Media', contratistaId: 'CTA-02', costoEstimado: 47_000, estatus: 'Validado', creadaHaceDias: 22, cierraEnDias: 4 },
  { naveId: 'NAVE-12', sistemaCriticoId: null, categoria: 'Contra Incendio / SCI', descripcion: 'Recarga y certificación de extintores portátiles', prioridad: 'Baja', contratistaId: 'CTA-01', costoEstimado: 12_500, estatus: 'Validado', creadaHaceDias: 15, cierraEnDias: 2 },
  { naveId: 'NAVE-16', sistemaCriticoId: null, categoria: 'HVAC', descripcion: 'Cambio de banco de filtros HEPA en área de calidad', prioridad: 'Baja', contratistaId: 'CTA-03', costoEstimado: 21_000, estatus: 'Validado', creadaHaceDias: 18, cierraEnDias: 3 },
  { naveId: 'NAVE-08', sistemaCriticoId: null, categoria: 'Cubiertas y Techos', descripcion: 'Inspección de membrana pre-temporada de lluvias', prioridad: 'Media', contratistaId: 'CTA-04', costoEstimado: 33_000, estatus: 'Validado', creadaHaceDias: 26, cierraEnDias: 5 },
  { naveId: 'NAVE-18', sistemaCriticoId: null, categoria: 'Andenes & Rampas', descripcion: 'Ajuste de topes y luces de cortesía en 4 andenes', prioridad: 'Baja', contratistaId: 'CTA-06', costoEstimado: 9_800, estatus: 'Validado', creadaHaceDias: 12, cierraEnDias: 2 },
  { naveId: 'NAVE-14', sistemaCriticoId: null, categoria: 'Eléctrico & Subestación', descripcion: 'Termografía correctiva tras alarma de sobrecalentamiento', prioridad: 'Alta', contratistaId: 'CTA-02', costoEstimado: 58_000, estatus: 'En ejecución', creadaHaceDias: 2 },
  { naveId: 'NAVE-03', sistemaCriticoId: null, categoria: 'Pisos Industriales', descripcion: 'Resane de junta de expansión en pasillo principal', prioridad: 'Baja', contratistaId: 'CTA-05', costoEstimado: 15_500, estatus: 'Abierta', creadaHaceDias: 2 },
  { naveId: 'NAVE-05', sistemaCriticoId: null, categoria: 'Contra Incendio / SCI', descripcion: 'Sustitución de rociadores obstruidos en racks nivel 3', prioridad: 'Crítica', contratistaId: 'CTA-01', costoEstimado: 67_000, estatus: 'Abierta', creadaHaceDias: 0 },
  { naveId: 'NAVE-01', sistemaCriticoId: null, categoria: 'HVAC', descripcion: 'Mantenimiento correctivo menor de unidad de precisión en MDF', prioridad: 'Media', contratistaId: 'CTA-03', costoEstimado: 24_000, estatus: 'Validado', creadaHaceDias: 20, cierraEnDias: 3 },
  { naveId: 'NAVE-06', sistemaCriticoId: null, categoria: 'Sanidad Operativa', descripcion: 'Fumigación correctiva por hallazgo de plaga en zona de tarimas', prioridad: 'Alta', contratistaId: 'CTA-09', costoEstimado: 14_200, estatus: 'Validado', creadaHaceDias: 9, cierraEnDias: 1 },
  { naveId: 'NAVE-16', sistemaCriticoId: null, categoria: 'Andenes & Rampas', descripcion: 'Reemplazo de sello de cortina de andén 2, trabajo concluido en sitio', prioridad: 'Media', contratistaId: 'CTA-06', costoEstimado: 22_500, estatus: 'Pendiente de Evidencia', creadaHaceDias: 4 },
  { naveId: 'NAVE-08', sistemaCriticoId: null, categoria: 'HVAC', descripcion: 'Reporte duplicado — ya cubierto por la orden de inspección de cubierta en curso', prioridad: 'Baja', contratistaId: 'CTA-03', costoEstimado: 0, estatus: 'Cancelada', creadaHaceDias: 6, cierraEnDias: 1 },
]

export const ordenesTrabajo: OrdenTrabajo[] = seeds.map((s, idx) => {
  const fechaCreacion = addDays(HOY_ISO, -s.creadaHaceDias)
  const slaHoras = SLA_HORAS[s.prioridad]
  const fechaCompromiso = addDays(fechaCreacion, Math.ceil(slaHoras / 24))
  const fechaCierre = s.estatus === 'Validado' || s.estatus === 'Cancelada' ? addDays(fechaCreacion, s.cierraEnDias ?? 1) : null
  return {
    id: `OT-${String(idx + 1).padStart(3, '0')}`,
    folio: `OT-2026-${String(idx + 1).padStart(4, '0')}`,
    naveId: s.naveId,
    sistemaCriticoId: s.sistemaCriticoId,
    categoria: s.categoria,
    descripcion: s.descripcion,
    prioridad: s.prioridad,
    slaHoras,
    contratistaId: s.contratistaId,
    costoEstimado: s.costoEstimado,
    estatus: s.estatus,
    fechaCreacion,
    fechaCompromiso,
    fechaCierre,
  } satisfies OrdenTrabajo
})

export const ordenesPorNave = (naveId: string) => ordenesTrabajo.filter((o) => o.naveId === naveId)
export const ordenesAbiertas = () => ordenesTrabajo.filter((o) => o.estatus !== 'Validado' && o.estatus !== 'Cancelada')
