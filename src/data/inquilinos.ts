import type { Inquilino } from './types'

function contactos(dominio: string) {
  return {
    representanteLegal: { nombre: 'Lic. Fernanda Ibarra Cossío', puesto: 'Representante Legal', email: `fibarra@${dominio}`, telefono: '+52 55 4185 2201' },
    plantManager: { nombre: 'Ing. Raúl Domínguez Peña', puesto: 'Plant Manager', email: `rdominguez@${dominio}`, telefono: '+52 55 4185 2244' },
    contactoMantenimiento: { nombre: 'Ing. Sofía Elizondo Vera', puesto: 'Coordinadora de Mantenimiento', email: `selizondo@${dominio}`, telefono: '+52 55 4185 2278' },
    contactoCxP: { nombre: 'C.P. Mauricio Zapata Ruiz', puesto: 'Cuentas por Pagar', email: `mzapata@${dominio}`, telefono: '+52 55 4185 2299' },
  }
}

export const inquilinos: Inquilino[] = [
  { id: 'INQ-01', razonSocial: 'DHL Supply Chain México, S.A. de C.V.', nombreComercial: 'DHL Supply Chain México', industria: 'Logística & E-commerce', ...contactos('dhl-supplychain.mx') },
  { id: 'INQ-02', razonSocial: 'Vaxel Automotive Systems de México, S.A. de C.V.', nombreComercial: 'Vaxel Automotive Systems', industria: 'Automotriz & Tier 1', ...contactos('vaxel-automotive.mx') },
  { id: 'INQ-03', razonSocial: 'NorthPoint Logística de México, S.A.P.I. de C.V.', nombreComercial: 'NorthPoint Logística', industria: 'Logística & E-commerce', ...contactos('northpoint-logistica.mx') },
  { id: 'INQ-04', razonSocial: 'Praxis Industrial Components, S.A. de C.V.', nombreComercial: 'Praxis Industrial Components', industria: 'Manufactura Avanzada', ...contactos('praxis-components.mx') },
  { id: 'INQ-05', razonSocial: 'Cintra Fulfillment Solutions, S. de R.L. de C.V.', nombreComercial: 'Cintra Fulfillment Solutions', industria: 'Logística & E-commerce', ...contactos('cintra-fulfillment.mx') },
  { id: 'INQ-06', razonSocial: 'Torque Drivetrain de México, S.A. de C.V.', nombreComercial: 'Torque Drivetrain de México', industria: 'Automotriz & Tier 1', ...contactos('torque-drivetrain.mx') },
  { id: 'INQ-07', razonSocial: 'Ferrotec Precisión Industrial, S.A. de C.V.', nombreComercial: 'Ferrotec Precisión Industrial', industria: 'Manufactura Avanzada', ...contactos('ferrotec-precision.mx') },
  { id: 'INQ-08', razonSocial: 'Meridian Motors Componentes, S.A. de C.V.', nombreComercial: 'Meridian Motors Componentes', industria: 'Automotriz & Tier 1', ...contactos('meridian-motors.mx') },
  { id: 'INQ-09', razonSocial: 'Altavia Componentes Automotrices, S.A. de C.V.', nombreComercial: 'Altavia Componentes Automotrices', industria: 'Automotriz & Tier 1', ...contactos('altavia-componentes.mx') },
  { id: 'INQ-10', razonSocial: 'Nortex Manufacturing, S.A. de C.V.', nombreComercial: 'Nortex Manufacturing', industria: 'Manufactura Avanzada', ...contactos('nortex-mfg.mx') },
  { id: 'INQ-11', razonSocial: 'Vantex Supply Chain de México, S.A. de C.V.', nombreComercial: 'Vantex Supply Chain', industria: 'Logística & E-commerce', ...contactos('vantex-supplychain.mx') },
  { id: 'INQ-12', razonSocial: 'Roble Industrial de México, S.A. de C.V.', nombreComercial: 'Roble Industrial de México', industria: 'Otros', ...contactos('roble-industrial.mx') },
  { id: 'INQ-13', razonSocial: 'Katun Manufacturing de México, S.A. de C.V.', nombreComercial: 'Katun Manufacturing', industria: 'Manufactura Avanzada', ...contactos('katun-mfg.mx') },
  { id: 'INQ-14', razonSocial: 'Bluewave Electronics Manufacturing, S. de R.L. de C.V.', nombreComercial: 'Bluewave Electronics Manufacturing', industria: 'Manufactura Avanzada', ...contactos('bluewave-electronics.mx') },
  { id: 'INQ-15', razonSocial: 'Delta Forge Industrial, S.A. de C.V.', nombreComercial: 'Delta Forge Industrial', industria: 'Manufactura Avanzada', ...contactos('deltaforge-industrial.mx') },
  { id: 'INQ-16', razonSocial: 'Solventum Materials de México, S.A. de C.V.', nombreComercial: 'Solventum Materials de México', industria: 'Otros', ...contactos('solventum-materials.mx') },
  { id: 'INQ-17', razonSocial: 'Grupo Kanoa Logística, S.A.P.I. de C.V.', nombreComercial: 'Grupo Kanoa Logística', industria: 'Logística & E-commerce', ...contactos('kanoa-logistica.mx') },
  { id: 'INQ-18', razonSocial: 'Cobre y Acero Industrial, S.A. de C.V.', nombreComercial: 'Cobre y Acero Industrial', industria: 'Manufactura Avanzada', ...contactos('cobreyacero-industrial.mx') },
]

export const inquilinoById = (id: string) => inquilinos.find((i) => i.id === id)

// Relación 1:1 Nave -> Inquilino (NAVE-09 está disponible, sin inquilino activo).
export const inquilinoPorNaveId: Record<string, string | null> = {
  'NAVE-01': 'INQ-01',
  'NAVE-02': 'INQ-02',
  'NAVE-03': 'INQ-03',
  'NAVE-04': 'INQ-04',
  'NAVE-05': 'INQ-05',
  'NAVE-06': 'INQ-06',
  'NAVE-07': 'INQ-07',
  'NAVE-08': 'INQ-08',
  'NAVE-09': null,
  'NAVE-10': 'INQ-09',
  'NAVE-11': 'INQ-10',
  'NAVE-12': 'INQ-11',
  'NAVE-13': 'INQ-12',
  'NAVE-14': 'INQ-13',
  'NAVE-15': 'INQ-14',
  'NAVE-16': 'INQ-15',
  'NAVE-17': 'INQ-16',
  'NAVE-18': 'INQ-17',
  'NAVE-19': 'INQ-18',
}
