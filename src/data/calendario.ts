import type { EventoCalendario } from './types'

export const eventosCalendario: EventoCalendario[] = [
  { id: 'CAL-01', dia: 2, tipo: 'Mantenimiento Preventivo', hora: '08:00', descripcion: 'Prueba de arranque en frío — Planta de Emergencia', responsable: 'Generadores Continuidad Eléctrica', naveId: 'NAVE-01' },
  { id: 'CAL-02', dia: 3, tipo: 'Paro Técnico', hora: '22:00', descripcion: 'Paro programado de subestación para termografía', responsable: 'Voltium Ingeniería Eléctrica Industrial', naveId: 'NAVE-06' },
  { id: 'CAL-03', dia: 5, tipo: 'Auditoría', hora: '10:00', descripcion: 'Auditoría de seguridad STPS — sistema SCI', responsable: 'Ignífuga Sistemas Contra Incendio', naveId: 'NAVE-04' },
  { id: 'CAL-04', dia: 7, tipo: 'Mantenimiento Preventivo', hora: '09:00', descripcion: 'Servicio trimestral de unidades HVAC', responsable: 'Climatec Soluciones HVAC', naveId: 'NAVE-08' },
  { id: 'CAL-05', dia: 8, tipo: 'Inspección', hora: '11:30', descripcion: 'Inspección de cubierta pre-temporada de lluvias', responsable: 'Cubiertas del Bajío', naveId: 'NAVE-10' },
  { id: 'CAL-06', dia: 10, tipo: 'Paro Técnico', hora: '20:00', descripcion: 'Ventana de mantenimiento de andenes y niveladoras', responsable: 'Andenes y Rampas del Norte', naveId: 'NAVE-11' },
  { id: 'CAL-07', dia: 12, tipo: 'Mantenimiento Preventivo', hora: '08:30', descripcion: 'Recarga y certificación de extintores portátiles', responsable: 'Ignífuga Sistemas Contra Incendio', naveId: 'NAVE-12' },
  { id: 'CAL-08', dia: 13, tipo: 'Auditoría', hora: '09:00', descripcion: 'Auditoría de cumplimiento NOM-001-SEDE', responsable: 'Voltium Ingeniería Eléctrica Industrial', naveId: 'NAVE-14' },
  { id: 'CAL-09', dia: 15, tipo: 'Mantenimiento Preventivo', hora: '08:00', descripcion: 'Levantamiento de planicidad de pisos industriales', responsable: 'Pisos Industriales Monolith', naveId: 'NAVE-15' },
  { id: 'CAL-10', dia: 16, tipo: 'Paro Técnico', hora: '23:00', descripcion: 'Paro nocturno para prueba hidrostática de red SCI', responsable: 'Ignífuga Sistemas Contra Incendio', naveId: 'NAVE-06' },
  { id: 'CAL-11', dia: 18, tipo: 'Inspección', hora: '10:00', descripcion: 'Inspección de planta de emergencia y transferencia automática', responsable: 'Generadores Continuidad Eléctrica', naveId: 'NAVE-16' },
  { id: 'CAL-12', dia: 19, tipo: 'Sanidad', hora: '07:00', descripcion: 'Fumigación preventiva trimestral', responsable: 'Sanitización Industrial Pura Vida', naveId: 'NAVE-01' },
  { id: 'CAL-13', dia: 21, tipo: 'Mantenimiento Preventivo', hora: '09:00', descripcion: 'Servicio de unidades HVAC en área administrativa', responsable: 'Climatec Soluciones HVAC', naveId: 'NAVE-19' },
  { id: 'CAL-14', dia: 22, tipo: 'Auditoría', hora: '11:00', descripcion: 'Auditoría LEED de consumo energético', responsable: 'Voltium Ingeniería Eléctrica Industrial', naveId: 'NAVE-06' },
  { id: 'CAL-15', dia: 24, tipo: 'Paro Técnico', hora: '21:00', descripcion: 'Paro programado — modernización eléctrica fase 3', responsable: 'Voltium Ingeniería Eléctrica Industrial', naveId: 'NAVE-07' },
  { id: 'CAL-16', dia: 26, tipo: 'Inspección', hora: '10:30', descripcion: 'Inspección de andenes y cortinas de carga', responsable: 'Andenes y Rampas del Norte', naveId: 'NAVE-18' },
  { id: 'CAL-17', dia: 27, tipo: 'Mantenimiento Preventivo', hora: '08:00', descripcion: 'Prueba de arranque en frío — Planta de Emergencia', responsable: 'Generadores Continuidad Eléctrica', naveId: 'NAVE-12' },
  { id: 'CAL-18', dia: 28, tipo: 'Sanidad', hora: '07:30', descripcion: 'Fumigación correctiva de seguimiento', responsable: 'Sanitización Industrial Pura Vida', naveId: 'NAVE-06' },
]

export const eventosPorSemana = (semana: 1 | 2 | 3 | 4) => {
  const desde = (semana - 1) * 7 + 1
  const hasta = semana * 7
  return eventosCalendario.filter((e) => e.dia >= desde && e.dia <= hasta)
}
