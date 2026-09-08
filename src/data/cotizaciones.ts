import type { SolicitudCotizacion } from './types'

export const solicitudesCotizacion: SolicitudCotizacion[] = [
  {
    id: 'RFP-01',
    folio: 'RFP-2026-0041',
    naveId: 'NAVE-13',
    titulo: 'Reposición de cubierta e impermeabilización — Nave 02 SLP',
    propuestas: [
      { proveedor: 'Cubiertas del Bajío, S.A. de C.V.', precio: 1_980_000, garantiaMeses: 60, recibida: true, mejorOferta: true },
      { proveedor: 'Grupo Constructor Meridiano', precio: 2_150_000, garantiaMeses: 36, recibida: true, mejorOferta: false },
      { proveedor: 'Estructuras Metálicas Torreón', precio: 0, garantiaMeses: 0, recibida: false, mejorOferta: false },
    ],
    recibidas: 2,
    total: 3,
    diasParaVencer: 5,
  },
  {
    id: 'RFP-02',
    folio: 'RFP-2026-0044',
    naveId: 'NAVE-19',
    titulo: 'Sustitución de sistema HVAC administrativo',
    propuestas: [
      { proveedor: 'Climatec Soluciones HVAC', precio: 640_000, garantiaMeses: 36, recibida: true, mejorOferta: true },
      { proveedor: 'Voltium Ingeniería Eléctrica Industrial', precio: 0, garantiaMeses: 0, recibida: false, mejorOferta: false },
      { proveedor: 'Grupo Constructor Meridiano', precio: 0, garantiaMeses: 0, recibida: false, mejorOferta: false },
    ],
    recibidas: 1,
    total: 3,
    diasParaVencer: 2,
  },
  {
    id: 'RFP-03',
    folio: 'RFP-2026-0038',
    naveId: 'NAVE-11',
    titulo: 'Reparación de sello hidráulico — niveladora andén 6',
    propuestas: [
      { proveedor: 'Andenes y Rampas del Norte', precio: 31_000, garantiaMeses: 12, recibida: true, mejorOferta: true },
      { proveedor: 'Grupo Constructor Meridiano', precio: 38_500, garantiaMeses: 6, recibida: true, mejorOferta: false },
      { proveedor: 'Estructuras Metálicas Torreón', precio: 36_200, garantiaMeses: 6, recibida: true, mejorOferta: false },
    ],
    recibidas: 3,
    total: 3,
    diasParaVencer: null,
  },
  {
    id: 'RFP-04',
    folio: 'RFP-2026-0046',
    naveId: 'NAVE-11',
    titulo: 'Renivelación de pisos industriales en zona de racking automatizado',
    propuestas: [
      { proveedor: 'Pisos Industriales Monolith', precio: 890_000, garantiaMeses: 48, recibida: true, mejorOferta: true },
      { proveedor: 'Grupo Constructor Meridiano', precio: 960_000, garantiaMeses: 24, recibida: true, mejorOferta: false },
      { proveedor: 'Estructuras Metálicas Torreón', precio: 915_000, garantiaMeses: 24, recibida: true, mejorOferta: false },
    ],
    recibidas: 3,
    total: 3,
    diasParaVencer: null,
  },
]
