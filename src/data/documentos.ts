import type { DocumentoPermiso, EstatusDocumental } from './types'
import { naves } from './naves'
import { parqueById } from './parques'
import { addDays, diasEntre, HOY } from '../lib/dates'

// Naves con alerta predial activa (coincide con estatusOperativo === 'Alerta Predial Pendiente').
const PREDIAL_ALERTA = new Set(['NAVE-05', 'NAVE-17'])
// Nave suspendida por mora — su Predial también queda en mora.
const PREDIAL_MORA = new Set(['NAVE-13'])

// ventanaAvisoDias es la ventana de "por vencer" (el umbral de advertencia de cada
// documento); el umbral crítico se calcula aparte en alertas.ts sobre la misma fecha.
function estatusPorVencimiento(
  fechaVencimiento: string | null,
  ventanaAvisoDias: number,
  moraSet?: Set<string>,
  naveId?: string,
): EstatusDocumental {
  if (moraSet && naveId && moraSet.has(naveId)) return 'En mora / fuera de plazo'
  if (!fechaVencimiento) return 'Aprobado / al día'
  const dias = diasEntre(HOY, fechaVencimiento)
  if (dias < 0) return 'En mora / fuera de plazo'
  if (dias <= ventanaAvisoDias) return 'Pendiente de envío / por vencer'
  return 'Aprobado / al día'
}

let contador = 0
function nextId() {
  contador += 1
  return `DOC-${String(contador).padStart(4, '0')}`
}

export const documentos: DocumentoPermiso[] = naves.flatMap((nave, idx) => {
  const parque = parqueById(nave.parqueId)!
  const docs: DocumentoPermiso[] = []

  // 1. Licencia de Construcción — no vence, aprobada al término de la obra.
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Licencia de Construcción',
    dependenciaEmisora: `Dirección de Obras Públicas de ${parque.ciudad}`,
    numeroFolio: `LC-${parque.estado.slice(0, 3).toUpperCase()}-${1000 + idx * 7}`,
    fechaEmision: nave.fechaEntrega,
    fechaVencimiento: null,
    estatusJuridico: 'Aprobado / al día',
    archivoUrl: `/dossier/${nave.id}/licencia-construccion.pdf`,
  })

  // 2. Manifestación de Impacto Ambiental — no vence.
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Manifestación de Impacto Ambiental',
    dependenciaEmisora: `SEMARNAT — Delegación ${parque.estado}`,
    numeroFolio: `MIA-${parque.estado.slice(0, 3).toUpperCase()}-${2000 + idx * 11}`,
    fechaEmision: addDays(nave.fechaEntrega, 45),
    fechaVencimiento: null,
    estatusJuridico: 'Aprobado / al día',
    archivoUrl: `/dossier/${nave.id}/mia.pdf`,
  })

  // 3. Memoria de Cálculo Estructural — no vence.
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Memoria de Cálculo Estructural',
    dependenciaEmisora: `Director Responsable de Obra — Colegio de Ingenieros Civiles de ${parque.estado}`,
    numeroFolio: `MCE-${parque.estado.slice(0, 3).toUpperCase()}-${3000 + idx * 13}`,
    fechaEmision: nave.fechaEntrega,
    fechaVencimiento: null,
    estatusJuridico: 'Aprobado / al día',
    archivoUrl: `/dossier/${nave.id}/memoria-calculo.pdf`,
  })

  // 4. Dictamen de Protección Civil — vigencia anual. Alerta a 30 días, crítico a 10.
  const dpcVence = addDays(HOY.toISOString().slice(0, 10), (idx * 53) % 365)
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Dictamen de Protección Civil',
    dependenciaEmisora: `Protección Civil Municipal de ${parque.ciudad}`,
    numeroFolio: `PC-${parque.estado.slice(0, 3).toUpperCase()}-${4000 + idx * 9}`,
    fechaEmision: addDays(dpcVence, -365),
    fechaVencimiento: dpcVence,
    estatusJuridico: estatusPorVencimiento(dpcVence, 30),
    archivoUrl: `/dossier/${nave.id}/dictamen-proteccion-civil.pdf`,
  })

  // 5. Póliza Multirriesgo Industrial — vigencia anual. Alerta a 60 días, crítico a 30.
  const polizaVence = addDays(HOY.toISOString().slice(0, 10), (idx * 67 + 20) % 365)
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Póliza Multirriesgo Industrial',
    dependenciaEmisora: 'Grupo Asegurador Andes, S.A.',
    numeroFolio: `POL-MRI-${5000 + idx * 17}`,
    fechaEmision: addDays(polizaVence, -365),
    fechaVencimiento: polizaVence,
    estatusJuridico: estatusPorVencimiento(polizaVence, 60),
    archivoUrl: `/dossier/${nave.id}/poliza-multirriesgo.pdf`,
  })

  // 6. Póliza de Responsabilidad Civil — vigencia anual. Alerta a 60 días, crítico a 30.
  const polizaRCVence = addDays(HOY.toISOString().slice(0, 10), (idx * 41 + 200) % 365)
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Póliza de Responsabilidad Civil',
    dependenciaEmisora: 'Grupo Asegurador Andes, S.A.',
    numeroFolio: `POL-RC-${6000 + idx * 19}`,
    fechaEmision: addDays(polizaRCVence, -365),
    fechaVencimiento: polizaRCVence,
    estatusJuridico: estatusPorVencimiento(polizaRCVence, 60),
    archivoUrl: `/dossier/${nave.id}/poliza-rc.pdf`,
  })

  // 7. Predial — ciclo enero/febrero; dos naves quedan deliberadamente en alerta,
  // alerta a 60 días, crítico a 30.
  const predialVencimiento = PREDIAL_ALERTA.has(nave.id) ? addDays(HOY.toISOString().slice(0, 10), 18) : '2027-02-28'
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Predial',
    dependenciaEmisora: `Tesorería Municipal de ${parque.ciudad}`,
    numeroFolio: `PRE-${parque.estado.slice(0, 3).toUpperCase()}-${7000 + idx * 3}`,
    fechaEmision: '2026-01-02',
    fechaVencimiento: predialVencimiento,
    estatusJuridico: estatusPorVencimiento(predialVencimiento, 60, PREDIAL_MORA, nave.id),
    archivoUrl: `/dossier/${nave.id}/predial.pdf`,
  })

  // 8. Contrato CFE — vigencia multianual, sin alerta activa.
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Contrato CFE',
    dependenciaEmisora: 'Comisión Federal de Electricidad — Suministro Calificado',
    numeroFolio: `CFE-${8000 + idx * 5}`,
    fechaEmision: nave.fechaEntrega,
    fechaVencimiento: addDays(nave.fechaEntrega, 365 * 5),
    estatusJuridico: 'Aprobado / al día',
    archivoUrl: `/dossier/${nave.id}/contrato-cfe.pdf`,
  })

  // 9. Contrato de Agua y Drenaje — vigencia multianual, sin alerta activa.
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Contrato de Agua y Drenaje',
    dependenciaEmisora: `Organismo Operador Municipal de Agua Potable y Alcantarillado de ${parque.ciudad}`,
    numeroFolio: `AGUA-${9000 + idx * 5}`,
    fechaEmision: nave.fechaEntrega,
    fechaVencimiento: addDays(nave.fechaEntrega, 365 * 5),
    estatusJuridico: 'Aprobado / al día',
    archivoUrl: `/dossier/${nave.id}/contrato-agua.pdf`,
  })

  // 10. Licencia Ambiental Estatal — vigencia de 2 años. Alerta a 90 días, crítico a 45.
  const laeVence = addDays(HOY.toISOString().slice(0, 10), (idx * 61 + 90) % 730)
  docs.push({
    id: nextId(),
    naveId: nave.id,
    tipo: 'Licencia Ambiental Estatal',
    dependenciaEmisora: `Secretaría de Medio Ambiente de ${parque.estado}`,
    numeroFolio: `LAE-${parque.estado.slice(0, 3).toUpperCase()}-${10000 + idx * 23}`,
    fechaEmision: addDays(laeVence, -730),
    fechaVencimiento: laeVence,
    estatusJuridico: estatusPorVencimiento(laeVence, 90),
    archivoUrl: `/dossier/${nave.id}/licencia-ambiental.pdf`,
  })

  return docs
})

export const documentosPorNave = (naveId: string) => documentos.filter((d) => d.naveId === naveId)
