import type { ProyectoCapex } from './types'

// Bolsa de CapEx autorizada para el ejercicio fiscal en curso (USD).
export const CAPEX_BOLSA_ANUAL_USD = 12_500_000

export const proyectosCapex: ProyectoCapex[] = [
  {
    id: 'CPX-01',
    codigo: 'CPX-2026-014',
    naveId: 'NAVE-07',
    titulo: 'Modernización eléctrica integral — Subestación y tableros de media tensión',
    justificacionTecnica: 'Subestación con más de 12 años en operación, sin margen de crecimiento de carga y con hallazgos térmicos recurrentes en la última NOM-001-SEDE.',
    inversionEstimada: 3_450_000,
    roiProyectadoPct: 18,
    paybackAnios: 4.2,
    estatusComite: 'En Ejecución',
    cotizaciones: [
      { proveedor: 'Voltium Ingeniería Eléctrica Industrial', monto: 3_450_000, garantiaMeses: 24, recibida: true },
      { proveedor: 'Grupo Constructor Meridiano', monto: 3_780_000, garantiaMeses: 18, recibida: true },
      { proveedor: 'Estructuras Metálicas Torreón', monto: 3_610_000, garantiaMeses: 12, recibida: true },
    ],
    proveedorSeleccionado: 'Voltium Ingeniería Eléctrica Industrial',
    avanceFisicoPct: 62,
    avanceFinancieroPct: 55,
  },
  {
    id: 'CPX-02',
    codigo: 'CPX-2026-021',
    naveId: 'NAVE-13',
    titulo: 'Reposición de cubierta y sistema de impermeabilización — Nave 02 SLP',
    justificacionTecnica: 'Filtraciones recurrentes documentadas en 3 bitácoras de mantenimiento correctivo durante la última temporada de lluvias; riesgo de daño a inventario del inquilino.',
    inversionEstimada: 1_980_000,
    roiProyectadoPct: 12,
    paybackAnios: 5.1,
    estatusComite: 'En Revisión Comité',
    cotizaciones: [
      { proveedor: 'Cubiertas del Bajío, S.A. de C.V.', monto: 1_980_000, garantiaMeses: 60, recibida: true },
      { proveedor: 'Grupo Constructor Meridiano', monto: 2_150_000, garantiaMeses: 36, recibida: true },
    ],
    proveedorSeleccionado: null,
    avanceFisicoPct: 0,
    avanceFinancieroPct: 0,
  },
  {
    id: 'CPX-03',
    codigo: 'CPX-2026-009',
    naveId: 'NAVE-01',
    titulo: 'Ampliación de patio de maniobras y 4 andenes adicionales',
    justificacionTecnica: 'Solicitud del inquilino ante crecimiento de volumen operativo; incrementa renta contractual vía adenda de ampliación de GLA.',
    inversionEstimada: 2_750_000,
    roiProyectadoPct: 22,
    paybackAnios: 3.6,
    estatusComite: 'Aprobado por Dirección',
    cotizaciones: [
      { proveedor: 'Grupo Constructor Meridiano', monto: 2_750_000, garantiaMeses: 24, recibida: true },
      { proveedor: 'Estructuras Metálicas Torreón', monto: 2_890_000, garantiaMeses: 18, recibida: true },
    ],
    proveedorSeleccionado: 'Grupo Constructor Meridiano',
    avanceFisicoPct: 8,
    avanceFinancieroPct: 15,
  },
  {
    id: 'CPX-04',
    codigo: 'CPX-2026-027',
    naveId: 'NAVE-19',
    titulo: 'Sustitución de sistema HVAC en área administrativa',
    justificacionTecnica: 'Equipos originales de 2017 fuera de vida útil recomendada por fabricante; eficiencia de enfriamiento por debajo del 82%.',
    inversionEstimada: 640_000,
    roiProyectadoPct: 14,
    paybackAnios: 3.9,
    estatusComite: 'Pendiente 3ra Cotización',
    cotizaciones: [
      { proveedor: 'Climatec Soluciones HVAC', monto: 640_000, garantiaMeses: 36, recibida: true },
      { proveedor: '—', monto: 0, garantiaMeses: 0, recibida: false },
    ],
    proveedorSeleccionado: null,
    avanceFisicoPct: 0,
    avanceFinancieroPct: 0,
  },
  {
    id: 'CPX-05',
    codigo: 'CPX-2026-003',
    naveId: 'NAVE-06',
    titulo: 'Certificación LEED Gold — retrofit de iluminación LED y agua',
    justificacionTecnica: 'Compromiso ESG corporativo 2026; el inquilino condiciona renovación anticipada a certificación ambiental de la nave.',
    inversionEstimada: 1_120_000,
    roiProyectadoPct: 16,
    paybackAnios: 4.8,
    estatusComite: 'Concluido',
    cotizaciones: [
      { proveedor: 'Voltium Ingeniería Eléctrica Industrial', monto: 1_120_000, garantiaMeses: 24, recibida: true },
    ],
    proveedorSeleccionado: 'Voltium Ingeniería Eléctrica Industrial',
    avanceFisicoPct: 100,
    avanceFinancieroPct: 100,
  },
  {
    id: 'CPX-06',
    codigo: 'CPX-2026-032',
    naveId: 'NAVE-11',
    titulo: 'Renivelación de pisos industriales en zona de racking automatizado',
    justificacionTecnica: 'Desviación de planicidad detectada por auditoría de seguridad del inquilino, riesgo operativo para montacargas trilaterales.',
    inversionEstimada: 890_000,
    roiProyectadoPct: 11,
    paybackAnios: 5.4,
    estatusComite: 'En Revisión Comité',
    cotizaciones: [
      { proveedor: 'Pisos Industriales Monolith', monto: 890_000, garantiaMeses: 48, recibida: true },
      { proveedor: 'Grupo Constructor Meridiano', monto: 960_000, garantiaMeses: 24, recibida: true },
      { proveedor: 'Estructuras Metálicas Torreón', monto: 915_000, garantiaMeses: 24, recibida: true },
    ],
    proveedorSeleccionado: null,
    avanceFisicoPct: 0,
    avanceFinancieroPct: 0,
  },
]

export const proyectoCapexPorNave = (naveId: string, proyectosInput: ProyectoCapex[] = proyectosCapex) =>
  proyectosInput.filter((p) => p.naveId === naveId)

export const capexAutorizadoTotal = (proyectosInput: ProyectoCapex[] = proyectosCapex) =>
  proyectosInput
    .filter((p) => p.estatusComite === 'Aprobado por Dirección' || p.estatusComite === 'En Ejecución' || p.estatusComite === 'Concluido')
    .reduce((acc, p) => acc + p.inversionEstimada, 0)

export const capexDisponiblePct = (proyectosInput: ProyectoCapex[] = proyectosCapex) => {
  const usado = capexAutorizadoTotal(proyectosInput)
  return Math.round(((CAPEX_BOLSA_ANUAL_USD - usado) / CAPEX_BOLSA_ANUAL_USD) * 100)
}
