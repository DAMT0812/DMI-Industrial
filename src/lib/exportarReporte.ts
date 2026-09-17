import type { ContratoArrendamiento, Inquilino, Nave, ParqueIndustrial, ProyectoCapex } from '@/data/types'

interface KpisPortafolio {
  ocupacionGlobalPct: number
  glaTotal: number
  ingresoMensualTotalUSD: number
  cobranzaAlDiaPct: number
  capexAutorizadoTotal: number
  capexBolsaAnualUSD: number
  certificacionesLEEDCount: number
  cumplimientoSTPSPromedio: number
}

interface DatosReportePortafolio {
  naves: Nave[]
  contratos: ContratoArrendamiento[]
  parqueById: (id: string) => ParqueIndustrial | undefined
  inquilinoById: (id: string) => Inquilino | undefined
  proyectosCapex: ProyectoCapex[]
  kpis: KpisPortafolio
}

// Reporte real (no maqueta): toma exactamente los mismos datos que ya se ven en pantalla
// (naves/contratos/proyectos CapEx vía DataStoreContext, ya respaldados por Supabase) y
// los vierte en un .xlsx de tres hojas — mismo patrón que descargarPlantillaNaves().
export async function exportarReportePortafolio(datos: DatosReportePortafolio) {
  const XLSX = await import('xlsx')
  const { naves, contratos, parqueById, inquilinoById, proyectosCapex, kpis } = datos

  const hojaResumen = XLSX.utils.aoa_to_sheet([
    ['Reporte de Portafolio — DMI Industrial', ''],
    ['Generado', new Date().toLocaleString('es-MX')],
    [],
    ['Indicador', 'Valor'],
    ['Ocupación Global', `${kpis.ocupacionGlobalPct}%`],
    ['Área Bruta (GLA)', `${kpis.glaTotal.toLocaleString('es-MX')} m²`],
    ['Ingreso Mensual (NOI)', `USD ${kpis.ingresoMensualTotalUSD.toLocaleString('es-MX')}`],
    ['Cobranza & SLAs', `${kpis.cobranzaAlDiaPct}%`],
    ['CapEx Autorizado del Año', `USD ${kpis.capexAutorizadoTotal.toLocaleString('es-MX')}`],
    ['Bolsa CapEx Anual', `USD ${kpis.capexBolsaAnualUSD.toLocaleString('es-MX')}`],
    ['Certificaciones LEED', `${kpis.certificacionesLEEDCount} naves`],
    ['Cumplimiento Regulatorio STPS', `${kpis.cumplimientoSTPSPromedio}%`],
  ])
  hojaResumen['!cols'] = [{ wch: 32 }, { wch: 24 }]

  const filasDirectorio = naves.map((n) => {
    const parque = parqueById(n.parqueId)
    const contrato = contratos.find((c) => c.naveId === n.id)
    const inquilino = contrato ? inquilinoById(contrato.inquilinoId) : undefined
    return {
      Folio: n.folio,
      Parque: parque?.nombre ?? n.parqueId,
      Inquilino: inquilino?.nombreComercial ?? 'Disponible',
      'GLA (m²)': n.gla,
      'Renta Mensual (USD)': contrato?.rentaBaseMensual ?? '',
      'Vigencia de Contrato': contrato?.fechaVencimiento ?? '',
      'Estatus Operativo': n.estatusOperativo,
    }
  })
  const hojaDirectorio = XLSX.utils.json_to_sheet(filasDirectorio)
  hojaDirectorio['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 16 }, { wch: 20 }]

  const filasCapex = proyectosCapex.map((p) => {
    const nave = naves.find((n) => n.id === p.naveId)
    return {
      Código: p.codigo,
      Nave: nave?.folio ?? p.naveId,
      Proyecto: p.titulo,
      'Inversión Estimada (USD)': p.inversionEstimada,
      'ROI Proyectado (%)': p.roiProyectadoPct,
      'Estatus del Comité': p.estatusComite,
      'Avance Físico (%)': p.avanceFisicoPct,
    }
  })
  const hojaCapex = XLSX.utils.json_to_sheet(filasCapex)
  hojaCapex['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 32 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 14 }]

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen')
  XLSX.utils.book_append_sheet(libro, hojaDirectorio, 'Directorio de Naves')
  XLSX.utils.book_append_sheet(libro, hojaCapex, 'Proyectos CapEx')
  XLSX.writeFile(libro, `reporte-capex-noi-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
