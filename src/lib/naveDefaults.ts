import type { Nave } from '@/data'

// Campos que ni el alta manual ni la importación masiva capturan directamente — se
// derivan de tipo de propiedad / clase de activo / superficie, igual que hacía
// AltaInmuebleDialog antes de que la importación desde Excel (Fase 6k) necesitara la
// misma regla. Centralizado aquí para que ambos flujos den de alta naves consistentes.
export function derivarCamposNave(campos: Pick<Nave, 'tipoPropiedad' | 'claseActivo' | 'gla' | 'areaOficinas'>) {
  return {
    bahiaColumnas: '12m x 24m',
    usoDeSuelo:
      campos.tipoPropiedad === 'Bodega Logística'
        ? 'I-1 Industria Ligera y de Riesgo Bajo (Uso Logístico)'
        : 'I-2 Industria Mediana e Intensiva',
    sistemaConstructivo:
      campos.claseActivo === 'Clase A'
        ? 'Estructura metálica prefabricada, muros de block y panel aislante, cubierta tipo sándwich'
        : 'Estructura metálica, muros de block, cubierta galvanizada',
    numeroCajonesEstacionamiento: Math.round(campos.gla / 180) + Math.round(campos.areaOficinas / 20),
    tipoIluminacion: 'LED de alta eficiencia en nave y oficinas',
  }
}
