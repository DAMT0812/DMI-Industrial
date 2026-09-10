import type { ContratoArrendamiento } from './types'
import { naveById } from './naves'
import { inquilinoPorNaveId } from './inquilinos'

interface Deal {
  naveId: string
  tarifaPorM2: number // USD/m²/mes
  fechaInicio: string
  fechaVencimiento: string
  tipoContrato: ContratoArrendamiento['tipoContrato']
  esquemaIncremento: string
  opcionesRenovacion: string
  avalista: string
  clausulasEspeciales: string[]
  estatus: ContratoArrendamiento['estatus']
}

// Vigencias escalonadas a propósito para poblar las alertas T-12/T-9/T-6/T-3/T-1
// (fecha de referencia del portafolio: 2026-09-08).
const deals: Deal[] = [
  { naveId: 'NAVE-01', tarifaPorM2: 5.85, fechaInicio: '2021-04-01', fechaVencimiento: '2029-03-31', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'DHL Group Holding (Deutschland) — carta de crédito standby', clausulasEspeciales: ['Exclusividad de andenes 24/7', 'Derecho de preferencia sobre nave contigua'], estatus: 'Vigente' },
  { naveId: 'NAVE-02', tarifaPorM2: 4.35, fechaInicio: '2019-09-01', fechaVencimiento: '2026-10-03', tipoContrato: 'Doble Neto (NN)', esquemaIncremento: '4% anual fijo', opcionesRenovacion: '1 periodo de 3 años', avalista: 'Vaxel Holdings LLC', clausulasEspeciales: ['Cláusula de renovación anticipada 12 meses'], estatus: 'En Revisión' },
  { naveId: 'NAVE-03', tarifaPorM2: 5.6, fechaInicio: '2022-07-01', fechaVencimiento: '2028-06-30', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3.5% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'NorthPoint Capital Partners', clausulasEspeciales: ['CAM tope 8% anual'], estatus: 'Vigente' },
  { naveId: 'NAVE-04', tarifaPorM2: 6.1, fechaInicio: '2020-12-01', fechaVencimiento: '2027-11-30', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: 'Ajuste anual por INPC + 1%', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Praxis Industrial Holdings', clausulasEspeciales: ['Derecho de ampliación 20% GLA'], estatus: 'Vigente' },
  { naveId: 'NAVE-05', tarifaPorM2: 4.1, fechaInicio: '2018-05-01', fechaVencimiento: '2026-12-05', tipoContrato: 'Doble Neto (NN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '1 periodo de 3 años', avalista: 'Cintra Fulfillment Solutions (matriz)', clausulasEspeciales: [], estatus: 'Vigente' },
  { naveId: 'NAVE-06', tarifaPorM2: 6.4, fechaInicio: '2023-02-01', fechaVencimiento: '2031-01-31', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Torque Global Manufacturing Corp.', clausulasEspeciales: ['SLA de energía garantizada 99.5%'], estatus: 'Vigente' },
  { naveId: 'NAVE-07', tarifaPorM2: 3.9, fechaInicio: '2016-10-01', fechaVencimiento: '2026-09-28', tipoContrato: 'Bruto Modificado', esquemaIncremento: '4% anual fijo', opcionesRenovacion: 'Sin opción registrada', avalista: 'Ferrotec Precisión Industrial (aval solidario socios)', clausulasEspeciales: ['Penalización por retraso en pago CAM'], estatus: 'En Revisión' },
  { naveId: 'NAVE-08', tarifaPorM2: 6.75, fechaInicio: '2020-03-01', fechaVencimiento: '2030-02-28', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: 'Ajuste anual por INPC + 1.5%', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Meridian Motors Global', clausulasEspeciales: ['Cláusula BTS de reversión al arrendador'], estatus: 'Vigente' },
  { naveId: 'NAVE-10', tarifaPorM2: 6.5, fechaInicio: '2021-11-01', fechaVencimiento: '2029-10-31', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Altavia Componentes Automotrices (matriz)', clausulasEspeciales: ['Exclusividad territorial 15 km'], estatus: 'Vigente' },
  { naveId: 'NAVE-11', tarifaPorM2: 4.5, fechaInicio: '2017-08-01', fechaVencimiento: '2027-06-15', tipoContrato: 'Doble Neto (NN)', esquemaIncremento: '3.5% anual fijo', opcionesRenovacion: '1 periodo de 5 años', avalista: 'Nortex Manufacturing Holdings', clausulasEspeciales: [], estatus: 'Vigente' },
  { naveId: 'NAVE-12', tarifaPorM2: 5.3, fechaInicio: '2022-04-01', fechaVencimiento: '2028-03-31', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Vantex Global Supply Chain', clausulasEspeciales: ['Derecho de preferencia sobre nave 13'], estatus: 'Vigente' },
  { naveId: 'NAVE-13', tarifaPorM2: 3.6, fechaInicio: '2015-12-15', fechaVencimiento: '2026-12-14', tipoContrato: 'Bruto Modificado', esquemaIncremento: '4% anual fijo', opcionesRenovacion: 'Sin opción registrada', avalista: 'Roble Industrial de México (aval solidario)', clausulasEspeciales: ['Suspendida por falta de pago CAM y renta 2 meses'], estatus: 'En Mora' },
  { naveId: 'NAVE-14', tarifaPorM2: 5.1, fechaInicio: '2021-06-01', fechaVencimiento: '2027-05-31', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: 'Ajuste anual por INPC', opcionesRenovacion: '1 periodo de 5 años', avalista: 'Katun Manufacturing Group', clausulasEspeciales: [], estatus: 'Vigente' },
  { naveId: 'NAVE-15', tarifaPorM2: 4.4, fechaInicio: '2019-01-01', fechaVencimiento: '2026-11-30', tipoContrato: 'Doble Neto (NN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '1 periodo de 3 años', avalista: 'Bluewave Electronics Manufacturing (matriz)', clausulasEspeciales: [], estatus: 'Vigente' },
  { naveId: 'NAVE-16', tarifaPorM2: 4.7, fechaInicio: '2020-10-01', fechaVencimiento: '2027-09-30', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3.5% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Delta Forge Industrial Holdings', clausulasEspeciales: [], estatus: 'Vigente' },
  { naveId: 'NAVE-17', tarifaPorM2: 3.8, fechaInicio: '2016-05-01', fechaVencimiento: '2026-10-20', tipoContrato: 'Bruto Modificado', esquemaIncremento: '4% anual fijo', opcionesRenovacion: 'Sin opción registrada', avalista: 'Solventum Materials Corp.', clausulasEspeciales: ['En negociación de renovación anticipada'], estatus: 'En Revisión' },
  { naveId: 'NAVE-18', tarifaPorM2: 5.5, fechaInicio: '2023-03-01', fechaVencimiento: '2030-02-28', tipoContrato: 'Triple Net (NNN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '2 periodos de 5 años', avalista: 'Grupo Kanoa Holdings', clausulasEspeciales: [], estatus: 'Vigente' },
  { naveId: 'NAVE-19', tarifaPorM2: 4.6, fechaInicio: '2017-03-01', fechaVencimiento: '2027-02-28', tipoContrato: 'Doble Neto (NN)', esquemaIncremento: '3% anual fijo', opcionesRenovacion: '1 periodo de 5 años', avalista: 'Cobre y Acero Industrial (aval solidario)', clausulasEspeciales: [], estatus: 'Vigente' },
]

function mesesEntre(inicio: string, fin: string) {
  const a = new Date(inicio)
  const b = new Date(fin)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
}

export const contratos: ContratoArrendamiento[] = deals.map((d, idx) => {
  const nave = naveById(d.naveId)
  const gla = nave?.gla ?? 0
  const rentaBaseMensual = Math.round(d.tarifaPorM2 * gla)
  const cam = Math.round(rentaBaseMensual * 0.12)
  return {
    id: `CTR-${String(idx + 1).padStart(2, '0')}`,
    naveId: d.naveId,
    inquilinoId: inquilinoPorNaveId[d.naveId] ?? '',
    fechaInicio: d.fechaInicio,
    fechaEntrega: d.fechaInicio,
    fechaVencimiento: d.fechaVencimiento,
    plazoMeses: mesesEntre(d.fechaInicio, d.fechaVencimiento),
    moneda: 'USD',
    rentaBaseMensual,
    tarifaPorM2: d.tarifaPorM2,
    cam,
    depositoGarantia: rentaBaseMensual * 2,
    esquemaIncremento: d.esquemaIncremento,
    opcionesRenovacion: d.opcionesRenovacion,
    tipoContrato: d.tipoContrato,
    avalista: d.avalista,
    clausulasEspeciales: d.clausulasEspeciales,
    estatus: d.estatus,
  }
})

export const contratoPorNaveId = (naveId: string, contratosInput: ContratoArrendamiento[] = contratos) =>
  contratosInput.find((c) => c.naveId === naveId)
