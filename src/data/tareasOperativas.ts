import type { TareaOperativa } from './types'

export const tareasOperativas: TareaOperativa[] = [
  // Por Iniciar
  { id: 'TSK-01', categoria: 'Regulatorio Legal', titulo: 'Trámite de renovación de Dictamen de Protección Civil', naveId: 'NAVE-02', responsable: 'Lic. Andrés Villalpando — Coordinador Legal & Cumplimiento', columna: 'Por Iniciar', costoEstimado: 45_000, avancePct: null, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-02', categoria: 'Mantenimiento Mayor', titulo: 'Diagnóstico de vida remanente — Subestación Nave 02 Apodaca', naveId: 'NAVE-07', responsable: 'Ing. Diego Salcedo — PM Regional Norte', columna: 'Por Iniciar', costoEstimado: 65_000, avancePct: null, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-03', categoria: 'Sanidad Operativa', titulo: 'Programa anual de control de plagas — parques Bajío', naveId: 'NAVE-04', responsable: 'Ing. Paola Reséndiz — PM Regional Bajío', columna: 'Por Iniciar', costoEstimado: 28_000, avancePct: null, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-04', categoria: 'CapEx Prioritario', titulo: 'Levantamiento técnico para renivelación de pisos', naveId: 'NAVE-11', responsable: 'Ing. Tomás Guerrero — Facility Manager', columna: 'Por Iniciar', costoEstimado: 890_000, avancePct: null, cotizacionesRecibidas: null, slaRestanteHoras: null },

  // En Cotización
  { id: 'TSK-05', categoria: 'CapEx Prioritario', titulo: 'Reposición de cubierta e impermeabilización', naveId: 'NAVE-13', responsable: 'Ing. Diego Salcedo — PM Regional Norte', columna: 'En Cotización', costoEstimado: 1_980_000, avancePct: null, cotizacionesRecibidas: '2/3 recibidas', slaRestanteHoras: null },
  { id: 'TSK-06', categoria: 'Mantenimiento Mayor', titulo: 'Sustitución de HVAC administrativo', naveId: 'NAVE-19', responsable: 'Arq. Mariana Cobos — PM Regional Occidente', columna: 'En Cotización', costoEstimado: 640_000, avancePct: null, cotizacionesRecibidas: '1/3 recibidas', slaRestanteHoras: null },
  { id: 'TSK-07', categoria: 'Correctivo Inmediato', titulo: 'Reparación de sello hidráulico — niveladora andén 6', naveId: 'NAVE-11', responsable: 'Ing. Tomás Guerrero — Facility Manager', columna: 'En Cotización', costoEstimado: 31_000, avancePct: null, cotizacionesRecibidas: '3/3 recibidas · Listo', slaRestanteHoras: 26 },
  { id: 'TSK-08', categoria: 'Cobranza CAM', titulo: 'Regularización de adeudo CAM — Nave 02 SLP', naveId: 'NAVE-13', responsable: 'C.P. Renata Solís — Coordinadora de Cobranza CAM', columna: 'En Cotización', costoEstimado: null, avancePct: null, cotizacionesRecibidas: null, slaRestanteHoras: null },

  // En Ejecución
  { id: 'TSK-09', categoria: 'CapEx Prioritario', titulo: 'Modernización eléctrica integral — subestación y tableros', naveId: 'NAVE-07', responsable: 'Ing. Diego Salcedo — PM Regional Norte', columna: 'En Ejecución', costoEstimado: 3_450_000, avancePct: 62, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-10', categoria: 'CapEx Prioritario', titulo: 'Ampliación de patio de maniobras y 4 andenes', naveId: 'NAVE-01', responsable: 'Arq. Mariana Cobos — PM Regional Occidente', columna: 'En Ejecución', costoEstimado: 2_750_000, avancePct: 8, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-11', categoria: 'Correctivo Inmediato', titulo: 'Filtración activa en junta de dilatación de cubierta', naveId: 'NAVE-02', responsable: 'Arq. Mariana Cobos — PM Regional Occidente', columna: 'En Ejecución', costoEstimado: 145_000, avancePct: 30, cotizacionesRecibidas: null, slaRestanteHoras: 3 },
  { id: 'TSK-12', categoria: 'Preventivo', titulo: 'Termografía correctiva por sobrecalentamiento en tablero', naveId: 'NAVE-14', responsable: 'Ing. Paola Reséndiz — PM Regional Bajío', columna: 'En Ejecución', costoEstimado: 58_000, avancePct: 70, cotizacionesRecibidas: null, slaRestanteHoras: 14 },

  // Completado & Auditado
  { id: 'TSK-13', categoria: 'CapEx Prioritario', titulo: 'Certificación LEED Gold — retrofit LED y agua', naveId: 'NAVE-06', responsable: 'Ing. Diego Salcedo — PM Regional Norte', columna: 'Completado & Auditado', costoEstimado: 1_120_000, avancePct: 100, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-14', categoria: 'Preventivo', titulo: 'Mantenimiento correctivo de banco de capacitores', naveId: 'NAVE-10', responsable: 'Ing. Diego Salcedo — PM Regional Norte', columna: 'Completado & Auditado', costoEstimado: 47_000, avancePct: 100, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-15', categoria: 'Sanidad Operativa', titulo: 'Fumigación correctiva por hallazgo de plaga', naveId: 'NAVE-06', responsable: 'Ing. Diego Salcedo — PM Regional Norte', columna: 'Completado & Auditado', costoEstimado: 14_200, avancePct: 100, cotizacionesRecibidas: null, slaRestanteHoras: null },
  { id: 'TSK-16', categoria: 'Regulatorio Legal', titulo: 'Renovación de Póliza Multirriesgo Industrial vencida', naveId: 'NAVE-05', responsable: 'Lic. Andrés Villalpando — Coordinador Legal & Cumplimiento', columna: 'Completado & Auditado', costoEstimado: 210_000, avancePct: 100, cotizacionesRecibidas: null, slaRestanteHoras: null },
]

export const tareasPorColumna = (columna: TareaOperativa['columna']) => tareasOperativas.filter((t) => t.columna === columna)
