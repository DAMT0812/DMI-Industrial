// Vista agregada de portafolio para el dashboard de Mantenimiento & SLAs — no es
// por nave (eso vive en sistemasCriticos.ts), es la matriz de confiabilidad global.
export interface SistemaConfiabilidad {
  id: string
  sistema: string
  codigoReferencia: string
  descripcionIntervencion: string
  indicador: string
  estatusSalud: 'Óptimo' | 'Alerta' | 'Crítico'
}

export const matrizConfiabilidad: SistemaConfiabilidad[] = [
  {
    id: 'MC-01',
    sistema: 'Cubiertas y Techos',
    codigoReferencia: 'NMX-C-460-ONNCCE',
    descripcionIntervencion: 'Inspección de membrana impermeabilizante pre-temporada de lluvias — 8 naves atendidas este trimestre',
    indicador: 'Salud Estructural 96% · Óptimo',
    estatusSalud: 'Óptimo',
  },
  {
    id: 'MC-02',
    sistema: 'Contra Incendio / SCI',
    codigoReferencia: 'NFPA-13 / NOM-002-STPS',
    descripcionIntervencion: 'Prueba hidrostática de red húmeda en Nave 02 Apodaca — presión por debajo del rango objetivo',
    indicador: 'Presión Estática 132 PSI · Alerta',
    estatusSalud: 'Alerta',
  },
  {
    id: 'MC-03',
    sistema: 'Eléctrico & Subestación',
    codigoReferencia: 'NOM-001-SEDE-2012',
    descripcionIntervencion: 'Termografía infrarroja trimestral en tableros de media tensión — sin puntos calientes detectados',
    indicador: 'Carga Operativa 78% · Óptimo',
    estatusSalud: 'Óptimo',
  },
  {
    id: 'MC-04',
    sistema: 'Pisos Industriales',
    codigoReferencia: 'ACI 302.1R (FF/FL)',
    descripcionIntervencion: 'Levantamiento de planicidad post-tráfico pesado en Nave BTS Silao — dentro de tolerancia',
    indicador: 'Planicidad FF 54 · Óptimo',
    estatusSalud: 'Óptimo',
  },
  {
    id: 'MC-05',
    sistema: 'Andenes & Rampas',
    codigoReferencia: 'NOM-004-STPS',
    descripcionIntervencion: 'Reemplazo de sellos de niveladora hidráulica en 3 andenes de El Salto Nave 07',
    indicador: 'Desgaste Estructural 14% · Alerta',
    estatusSalud: 'Alerta',
  },
]
