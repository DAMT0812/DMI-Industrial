import type { AlertaVencimiento } from './types'
import { documentos } from './documentos'
import { contratos } from './contratos'
import { ordenesTrabajo } from './ordenesTrabajo'
import { naveById } from './naves'
import { parqueById } from './parques'
import { diasParaVencer } from '../lib/dates'

function urgenciaPorDias(dias: number, umbralCritico: number, umbralAdvertencia: number): AlertaVencimiento['urgencia'] {
  if (dias <= umbralCritico) return 'Crítico Inminente'
  if (dias <= umbralAdvertencia) return 'Garantía Legal'
  return 'En Cumplimiento'
}

function nombreNave(naveId: string) {
  const nave = naveById(naveId)
  const parque = nave ? parqueById(nave.parqueId) : undefined
  return nave && parque ? `${parque.nombre} — Nave ${nave.numeroNave}` : naveId
}

let contador = 0
function nextId() {
  contador += 1
  return `ALT-${String(contador).padStart(3, '0')}`
}

function alertasDePolizas(): AlertaVencimiento[] {
  return documentos
    .filter((d) => (d.tipo === 'Póliza Multirriesgo Industrial' || d.tipo === 'Póliza de Responsabilidad Civil') && d.fechaVencimiento)
    .map((d) => {
      const dias = diasParaVencer(d.fechaVencimiento)!
      return { d, dias }
    })
    .filter(({ dias }) => dias <= 60)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 3)
    .map(({ d, dias }) => ({
      id: nextId(),
      tipo: 'Póliza Corporativa',
      naveId: d.naveId,
      descripcion: `${d.tipo} · Folio ${d.numeroFolio} — ${nombreNave(d.naveId)}`,
      diasParaVencer: dias,
      urgencia: urgenciaPorDias(dias, 30, 60),
      montoOSuperficie: null,
      responsable: 'Lic. Andrés Villalpando — Coordinador Legal & Cumplimiento',
      accion: 'Subir Endoso',
      estatus: 'Pendiente',
    }))
}

function alertasDePredial(): AlertaVencimiento[] {
  return documentos
    .filter((d) => d.tipo === 'Predial' && d.fechaVencimiento)
    .map((d) => ({ d, dias: diasParaVencer(d.fechaVencimiento)! }))
    .filter(({ dias, d }) => dias <= 60 || d.estatusJuridico === 'En mora / fuera de plazo')
    .sort((a, b) => a.dias - b.dias)
    .map(({ d, dias }) => ({
      id: nextId(),
      tipo: 'Tesorería Municipal',
      naveId: d.naveId,
      descripcion: `Predial ${d.estatusJuridico === 'En mora / fuera de plazo' ? 'en mora' : 'ciclo enero–febrero'} · Folio ${d.numeroFolio} — ${nombreNave(d.naveId)}`,
      diasParaVencer: dias,
      urgencia: d.estatusJuridico === 'En mora / fuera de plazo' ? 'Crítico Inminente' : urgenciaPorDias(dias, 30, 60),
      montoOSuperficie: null,
      responsable: 'C.P. Renata Solís — Coordinadora de Cobranza CAM',
      accion: 'Liquidar en Tesorería',
      estatus: 'Pendiente',
    }))
}

function alertasDeProteccionCivil(): AlertaVencimiento[] {
  return documentos
    .filter((d) => d.tipo === 'Dictamen de Protección Civil' && d.fechaVencimiento)
    .map((d) => ({ d, dias: diasParaVencer(d.fechaVencimiento)! }))
    .filter(({ dias }) => dias <= 30)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 3)
    .map(({ d, dias }) => ({
      id: nextId(),
      tipo: 'Protección Civil',
      naveId: d.naveId,
      descripcion: `Renovación de Dictamen de Protección Civil · Folio ${d.numeroFolio} — ${nombreNave(d.naveId)}`,
      diasParaVencer: dias,
      urgencia: urgenciaPorDias(dias, 10, 30),
      montoOSuperficie: null,
      responsable: 'Ing. Tomás Guerrero — Facility Manager Regional Norte',
      accion: 'Ver Certificado PDF',
      estatus: 'Pendiente',
    }))
}

function alertasDeLicenciaAmbiental(): AlertaVencimiento[] {
  return documentos
    .filter((d) => d.tipo === 'Licencia Ambiental Estatal' && d.fechaVencimiento)
    .map((d) => ({ d, dias: diasParaVencer(d.fechaVencimiento)! }))
    .filter(({ dias }) => dias <= 90)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 2)
    .map(({ d, dias }) => ({
      id: nextId(),
      tipo: 'Licencia Ambiental',
      naveId: d.naveId,
      descripcion: `Renovación de Licencia Ambiental Estatal · Folio ${d.numeroFolio} — ${nombreNave(d.naveId)}`,
      diasParaVencer: dias,
      urgencia: urgenciaPorDias(dias, 45, 90),
      montoOSuperficie: null,
      responsable: 'Lic. Andrés Villalpando — Coordinador Legal & Cumplimiento',
      accion: 'Gestionar Renovación',
      estatus: 'Pendiente',
    }))
}

function alertasDeLeasing(): AlertaVencimiento[] {
  return contratos
    .map((c) => ({ c, dias: diasParaVencer(c.fechaVencimiento)! }))
    .filter(({ dias }) => dias <= 180)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 4)
    .map(({ c, dias }) => ({
      id: nextId(),
      tipo: 'Leasing Comercial',
      naveId: c.naveId,
      descripcion: `Vencimiento de contrato de arrendamiento (${c.tipoContrato}) — ${nombreNave(c.naveId)}`,
      diasParaVencer: dias,
      urgencia: urgenciaPorDias(dias, 30, 120),
      montoOSuperficie: `${c.rentaBaseMensual.toLocaleString('es-MX')} USD/mes`,
      responsable: 'Ing. Arq. Rodrigo M. — Director de Operaciones',
      accion: 'Abrir Negociación',
      estatus: 'Pendiente',
    }))
}

function alertasDeSLA(): AlertaVencimiento[] {
  return ordenesTrabajo
    .filter((o) => o.estatus !== 'Validado' && o.estatus !== 'Cancelada' && (o.prioridad === 'Crítica' || o.prioridad === 'Alta'))
    .slice(0, 2)
    .map((o) => ({
      id: nextId(),
      tipo: 'SLA de Ticket',
      naveId: o.naveId,
      descripcion: `${o.folio} · ${o.categoria} — ${nombreNave(o.naveId)}`,
      diasParaVencer: 0,
      urgencia: o.prioridad === 'Crítica' ? 'Crítico Inminente' : 'Garantía Legal',
      montoOSuperficie: null,
      responsable: 'Ing. Tomás Guerrero — Facility Manager Regional Norte',
      accion: 'Ver Orden de Trabajo',
      estatus: 'Pendiente',
    }))
}

export const alertas: AlertaVencimiento[] = [
  ...alertasDePolizas(),
  ...alertasDePredial(),
  ...alertasDeProteccionCivil(),
  ...alertasDeLicenciaAmbiental(),
  ...alertasDeLeasing(),
  ...alertasDeSLA(),
].sort((a, b) => a.diasParaVencer - b.diasParaVencer)

export const requerimientosCriticos = () => alertas.filter((a) => a.urgencia === 'Crítico Inminente').length

export const vencimientosContrato90Dias = () =>
  contratos.filter((c) => (diasParaVencer(c.fechaVencimiento) ?? 9999) <= 90).length
