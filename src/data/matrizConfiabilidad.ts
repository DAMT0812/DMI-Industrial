// Tipo de la vista agregada de portafolio del dashboard de Mantenimiento & SLAs — los
// datos reales viven en la tabla matriz_confiabilidad (Fase 6r, vía DataStoreContext);
// este archivo solo conserva el tipo porque no hay un lugar mejor para él todavía.
export interface SistemaConfiabilidad {
  id: string
  sistema: string
  codigoReferencia: string
  descripcionIntervencion: string
  indicador: string
  estatusSalud: 'Óptimo' | 'Alerta' | 'Crítico'
}
