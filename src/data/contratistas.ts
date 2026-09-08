import type { Contratista } from './types'

export const contratistas: Contratista[] = [
  { id: 'CTA-01', nombre: 'Ignífuga Sistemas Contra Incendio, S.A. de C.V.', especialidad: 'Sistemas Contra Incendio (SCI)', calificacion: 4.8, polizaRC: 'Vigente', trabajosDelAno: 34, porcentajeOnTime: 96 },
  { id: 'CTA-02', nombre: 'Voltium Ingeniería Eléctrica Industrial', especialidad: 'Subestaciones & Eléctrico', calificacion: 4.6, polizaRC: 'Vigente', trabajosDelAno: 41, porcentajeOnTime: 93 },
  { id: 'CTA-03', nombre: 'Climatec Soluciones HVAC', especialidad: 'HVAC & Climatización Industrial', calificacion: 4.3, polizaRC: 'Vigente', trabajosDelAno: 52, porcentajeOnTime: 89 },
  { id: 'CTA-04', nombre: 'Cubiertas del Bajío, S.A. de C.V.', especialidad: 'Cubiertas & Impermeabilización', calificacion: 4.5, polizaRC: 'Por Vencer', trabajosDelAno: 22, porcentajeOnTime: 91 },
  { id: 'CTA-05', nombre: 'Pisos Industriales Monolith', especialidad: 'Pisos Industriales & Recubrimientos', calificacion: 4.7, polizaRC: 'Vigente', trabajosDelAno: 18, porcentajeOnTime: 97 },
  { id: 'CTA-06', nombre: 'Andenes y Rampas del Norte', especialidad: 'Andenes, Rampas & Niveladoras', calificacion: 4.2, polizaRC: 'Vigente', trabajosDelAno: 27, porcentajeOnTime: 88 },
  { id: 'CTA-07', nombre: 'Generadores Continuidad Eléctrica', especialidad: 'Plantas de Emergencia', calificacion: 4.4, polizaRC: 'Vigente', trabajosDelAno: 15, porcentajeOnTime: 94 },
  { id: 'CTA-08', nombre: 'Grupo Constructor Meridiano', especialidad: 'Obra Civil & CapEx Mayor', calificacion: 4.1, polizaRC: 'Vencida', trabajosDelAno: 9, porcentajeOnTime: 82 },
  { id: 'CTA-09', nombre: 'Sanitización Industrial Pura Vida', especialidad: 'Sanidad & Control de Plagas', calificacion: 4.9, polizaRC: 'Vigente', trabajosDelAno: 61, porcentajeOnTime: 99 },
  { id: 'CTA-10', nombre: 'Estructuras Metálicas Torreón', especialidad: 'Obra Civil & Estructuras', calificacion: 4.0, polizaRC: 'Vigente', trabajosDelAno: 12, porcentajeOnTime: 85 },
]

export const contratistaById = (id: string) => contratistas.find((c) => c.id === id)
