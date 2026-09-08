import type { SistemaCritico, TipoSistemaCritico } from './types'
import { naves } from './naves'
import { addDays, HOY } from '../lib/dates'

const HOY_ISO = HOY.toISOString().slice(0, 10)

interface Plantilla {
  tipo: TipoSistemaCritico
  vendorId: string
  vendorNombre: string
  frecuencia: SistemaCritico['frecuenciaMantenimiento']
  costoBase: number
  indicador: (idx: number) => { texto: string; estatus: SistemaCritico['estatusSalud'] }
  intervencion: string
}

const plantillas: Plantilla[] = [
  {
    tipo: 'Sistema Contra Incendio (SCI)',
    vendorId: 'CTA-01',
    vendorNombre: 'Ignífuga Sistemas Contra Incendio',
    frecuencia: 'Anual',
    costoBase: 185_000,
    indicador: (idx) => (idx % 6 === 0 ? { texto: 'Presión Estática 132 PSI · Alerta', estatus: 'Alerta' } : { texto: `Presión Estática ${148 + (idx % 5)} PSI · Óptimo`, estatus: 'Óptimo' }),
    intervencion: 'Prueba hidrostática de red húmeda y recarga de extintores',
  },
  {
    tipo: 'Subestación Eléctrica',
    vendorId: 'CTA-02',
    vendorNombre: 'Voltium Ingeniería Eléctrica Industrial',
    frecuencia: 'Anual',
    costoBase: 240_000,
    indicador: (idx) => ({ texto: `Carga Operativa ${68 + (idx % 20)}% · ${68 + (idx % 20) > 85 ? 'Alerta' : 'Óptimo'}`, estatus: 68 + (idx % 20) > 85 ? 'Alerta' : 'Óptimo' }),
    intervencion: 'Termografía infrarroja y mantenimiento de tableros de media tensión',
  },
  {
    tipo: 'HVAC',
    vendorId: 'CTA-03',
    vendorNombre: 'Climatec Soluciones HVAC',
    frecuencia: 'Trimestral',
    costoBase: 95_000,
    indicador: (idx) => ({ texto: `Eficiencia de Enfriamiento ${82 + (idx % 12)}% · ${82 + (idx % 12) < 88 ? 'Alerta' : 'Óptimo'}`, estatus: 82 + (idx % 12) < 88 ? 'Alerta' : 'Óptimo' }),
    intervencion: 'Cambio de filtros, carga de refrigerante y calibración de termostatos',
  },
  {
    tipo: 'Planta de Emergencia',
    vendorId: 'CTA-07',
    vendorNombre: 'Generadores Continuidad Eléctrica',
    frecuencia: 'Mensual',
    costoBase: 68_000,
    indicador: () => ({ texto: 'Arranque en Frío 100% · Óptimo', estatus: 'Óptimo' }),
    intervencion: 'Prueba de arranque en frío bajo carga y cambio de aceite/filtros',
  },
]

let contador = 0
function nextId() {
  contador += 1
  return `SIS-${String(contador).padStart(4, '0')}`
}

export const sistemasCriticos: SistemaCritico[] = naves.flatMap((nave, idx) => {
  // Las naves marcadas "Mant. Preventivo HVAC" fuerzan su sistema HVAC a estatus Alerta.
  const forzarAlertaHVAC = nave.estatusOperativo === 'Mant. Preventivo HVAC'

  return plantillas.map((p) => {
    const ind = p.indicador(idx + (p.tipo === 'HVAC' ? 3 : 0))
    const estatusSalud = p.tipo === 'HVAC' && forzarAlertaHVAC ? 'Alerta' : ind.estatus
    const indicadorSalud = p.tipo === 'HVAC' && forzarAlertaHVAC ? 'Eficiencia de Enfriamiento 79% · Alerta' : ind.texto

    const diasDesdeUltimo = 30 + ((idx * 17) % 150)
    const fechaUltimoMantenimiento = addDays(HOY_ISO, -diasDesdeUltimo)
    const vigenciaDias = p.frecuencia === 'Mensual' ? 30 : p.frecuencia === 'Trimestral' ? 90 : 365
    const fechaProximoMantenimiento = addDays(fechaUltimoMantenimiento, vigenciaDias)

    return {
      id: nextId(),
      naveId: nave.id,
      tipo: p.tipo,
      codigoReferencia: `${p.tipo === 'Sistema Contra Incendio (SCI)' ? 'NFPA-13/NOM-002' : p.tipo === 'Subestación Eléctrica' ? 'NOM-001-SEDE' : p.tipo === 'HVAC' ? 'ASHRAE-62.1' : 'NOM-001-SEDE / NFPA-110'}`,
      vendor: p.vendorNombre,
      frecuenciaMantenimiento: p.frecuencia,
      costoAnualEstimado: p.costoBase + (idx % 4) * 8_000,
      fechaUltimoMantenimiento,
      fechaProximoMantenimiento,
      indicadorSalud,
      estatusSalud,
      ultimaIntervencion: p.intervencion,
    } satisfies SistemaCritico
  })
})

export const sistemasPorNave = (naveId: string) => sistemasCriticos.filter((s) => s.naveId === naveId)
