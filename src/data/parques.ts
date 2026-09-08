import type { ParqueIndustrial } from './types'

export const parques: ParqueIndustrial[] = [
  { id: 'PQ-01', nombre: 'Parque Industrial DMI El Salto', region: 'Occidente', estado: 'Jalisco', ciudad: 'El Salto', corredorIndustrial: 'Corredor Guadalajara–El Salto' },
  { id: 'PQ-02', nombre: 'Parque Industrial DMI Querétaro Norte', region: 'Bajío', estado: 'Querétaro', ciudad: 'Querétaro', corredorIndustrial: 'Corredor Querétaro–San Juan del Río' },
  { id: 'PQ-03', nombre: 'Parque Industrial DMI Apodaca', region: 'Norte', estado: 'Nuevo León', ciudad: 'Apodaca', corredorIndustrial: 'Corredor Monterrey–Apodaca' },
  { id: 'PQ-04', nombre: 'Parque Industrial DMI Silao Bajío', region: 'Bajío', estado: 'Guanajuato', ciudad: 'Silao', corredorIndustrial: 'Corredor Bajío Automotriz' },
  { id: 'PQ-05', nombre: 'Parque Industrial DMI Saltillo Derramadero', region: 'Norte', estado: 'Coahuila', ciudad: 'Saltillo', corredorIndustrial: 'Corredor Saltillo–Ramos Arizpe' },
  { id: 'PQ-06', nombre: 'Parque Industrial DMI San Luis Potosí', region: 'Bajío', estado: 'San Luis Potosí', ciudad: 'San Luis Potosí', corredorIndustrial: 'Corredor Industrial SLP' },
  { id: 'PQ-07', nombre: 'Parque Industrial DMI Zapopan Tec', region: 'Occidente', estado: 'Jalisco', ciudad: 'Zapopan', corredorIndustrial: 'Corredor Zapopan Tecnológico' },
  { id: 'PQ-08', nombre: 'Parque Industrial DMI Aguascalientes', region: 'Bajío', estado: 'Aguascalientes', ciudad: 'Aguascalientes', corredorIndustrial: 'Corredor Aguascalientes Sur' },
  { id: 'PQ-09', nombre: 'Parque Industrial DMI Ramos Arizpe', region: 'Norte', estado: 'Coahuila', ciudad: 'Ramos Arizpe', corredorIndustrial: 'Corredor Saltillo–Ramos Arizpe' },
  { id: 'PQ-10', nombre: 'Parque Industrial DMI Ciudad Juárez', region: 'Norte', estado: 'Chihuahua', ciudad: 'Ciudad Juárez', corredorIndustrial: 'Corredor Fronterizo Juárez' },
  { id: 'PQ-11', nombre: 'Parque Industrial DMI Celaya', region: 'Bajío', estado: 'Guanajuato', ciudad: 'Celaya', corredorIndustrial: 'Corredor Bajío Automotriz' },
  { id: 'PQ-12', nombre: 'Parque Industrial DMI Reynosa', region: 'Norte', estado: 'Tamaulipas', ciudad: 'Reynosa', corredorIndustrial: 'Corredor Fronterizo Reynosa' },
  { id: 'PQ-13', nombre: 'Parque Industrial DMI León Interpuerto', region: 'Bajío', estado: 'Guanajuato', ciudad: 'León', corredorIndustrial: 'Interpuerto Guanajuato' },
  { id: 'PQ-14', nombre: 'Parque Industrial DMI Tlajomulco', region: 'Occidente', estado: 'Jalisco', ciudad: 'Tlajomulco de Zúñiga', corredorIndustrial: 'Corredor Guadalajara Sur' },
]

export const parqueById = (id: string) => parques.find((p) => p.id === id)
