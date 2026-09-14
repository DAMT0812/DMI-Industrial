import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { ContratoArrendamiento, DocumentoPermiso, Nave, OrdenTrabajo, ProyectoCapex, TareaOperativa } from '@/data/types'
import { supabase } from '@/lib/supabaseClient'
import { naves as navesBase, naveById as naveByIdBase } from '@/data/naves'
import { documentosPorNave as documentosPorNaveBase } from '@/data/documentos'
import { contratos as contratosBase, contratoPorNaveId as contratoPorNaveIdBase } from '@/data/contratos'
import { ordenesTrabajo as ordenesTrabajoBase, ordenesPorNave as ordenesPorNaveBase } from '@/data/ordenesTrabajo'
import { tareasOperativas as tareasOperativasBase } from '@/data/tareasOperativas'
import {
  proyectosCapex as proyectosCapexBase,
  proyectoCapexPorNave as proyectoCapexPorNaveBase,
  capexAutorizadoTotal as capexAutorizadoTotalBase,
  capexDisponiblePct as capexDisponiblePctBase,
} from '@/data/proyectosCapex'
import { calcularAlertas, requerimientosCriticos as requerimientosCriticosBase, vencimientosContrato90Dias as vencimientosContrato90DiasBase } from '@/data/alertas'
import { calcularTareasVivas } from '@/data/tareasVivas'
import * as portafolioKpis from '@/data/portafolioKpis'
import * as mantenimientoKpis from '@/data/mantenimientoKpis'
import { aplicarOverrides, type OverrideMap } from '@/data/overrides'

// Fundación de datos editables de la maqueta: cada entidad "editable" vive como
// arreglo base (src/data/*.ts, sin tocar) + un mapa de overrides de sesión que
// se fusiona aquí. Todo lo derivado (alertas, tareas vivas, KPIs de portafolio
// y mantenimiento) se recalcula de forma reactiva a partir de esos datos ya
// fusionados, así una edición se refleja automáticamente en cualquier pantalla
// que consuma estos mismos hooks — sin persistencia real entre sesiones.
interface DataStoreContextValue {
  naves: Nave[]
  naveById: (id: string) => Nave | undefined
  agregarNave: (nave: Nave) => void
  editarNave: (id: string, cambios: Partial<Nave>) => void

  documentos: DocumentoPermiso[]
  documentosPorNave: (naveId: string) => DocumentoPermiso[]
  editarDocumento: (id: string, cambios: Partial<DocumentoPermiso>) => void

  contratos: ContratoArrendamiento[]
  contratoPorNaveId: (naveId: string) => ContratoArrendamiento | undefined
  editarContrato: (id: string, cambios: Partial<ContratoArrendamiento>) => void

  ordenesTrabajo: OrdenTrabajo[]
  ordenesPorNave: (naveId: string) => OrdenTrabajo[]
  editarOrden: (id: string, cambios: Partial<OrdenTrabajo>) => void

  tareasOperativas: TareaOperativa[]
  editarTarea: (id: string, cambios: Partial<TareaOperativa>) => void

  proyectosCapex: ProyectoCapex[]
  proyectoCapexPorNave: (naveId: string) => ProyectoCapex[]
  editarCapex: (id: string, cambios: Partial<ProyectoCapex>) => void
  capexAutorizadoTotal: number
  capexDisponiblePct: number

  alertas: ReturnType<typeof calcularAlertas>
  tareasVivas: ReturnType<typeof calcularTareasVivas>
  requerimientosCriticos: number
  vencimientosContrato90Dias: number

  totalNaves: number
  navesOcupadas: number
  ocupacionGlobalPct: number
  glaTotal: number
  glaDisponible: number
  ingresoMensualTotalUSD: number
  cobranzaAlDiaPct: number
  certificacionesLEEDCount: number
  cumplimientoSTPSPromedio: number
  desgloseIndustria: ReturnType<typeof portafolioKpis.desgloseIndustria>
  serieNOIAnual: ReturnType<typeof portafolioKpis.serieNOIAnual>

  correctivosActivos: ReturnType<typeof mantenimientoKpis.correctivosActivos>
  capexProyectosMayores: number
  capexAutorizadoAnio: number
  slaPromedioResolucionHoras: number
  proyectoMayorEnCurso: ProyectoCapex | null
}

const DataStoreContext = createContext<DataStoreContextValue | null>(null)

// documentos ya vive en Supabase de verdad (Fase 6d) — el resto de entidades sigue
// como maqueta en memoria (overrides de sesión) hasta que les toque su propia fase
// de migración. Este mapeo traduce entre las columnas snake_case de la tabla
// "documentos" y el tipo DocumentoPermiso (camelCase) que ya consume toda la UI.
function documentoDeFila(fila: Record<string, unknown>): DocumentoPermiso {
  return {
    id: fila.id as string,
    naveId: fila.nave_id as string,
    tipo: fila.tipo as DocumentoPermiso['tipo'],
    dependenciaEmisora: fila.dependencia_emisora as string,
    numeroFolio: fila.numero_folio as string,
    fechaEmision: fila.fecha_emision as string,
    fechaVencimiento: fila.fecha_vencimiento as string | null,
    estatusJuridico: fila.estatus as DocumentoPermiso['estatusJuridico'],
    archivoUrl: (fila.archivo_url as string | null) ?? '',
    archivoPath: fila.archivo_path as string | null,
  }
}

function documentoAFila(cambios: Partial<DocumentoPermiso>): Record<string, unknown> {
  const fila: Record<string, unknown> = {}
  if (cambios.dependenciaEmisora !== undefined) fila.dependencia_emisora = cambios.dependenciaEmisora
  if (cambios.numeroFolio !== undefined) fila.numero_folio = cambios.numeroFolio
  if (cambios.fechaEmision !== undefined) fila.fecha_emision = cambios.fechaEmision
  if (cambios.fechaVencimiento !== undefined) fila.fecha_vencimiento = cambios.fechaVencimiento
  if (cambios.estatusJuridico !== undefined) fila.estatus = cambios.estatusJuridico
  if (cambios.archivoPath !== undefined) fila.archivo_path = cambios.archivoPath
  return fila
}

function crearEditor<T>(setOverrides: Dispatch<SetStateAction<OverrideMap<T>>>) {
  return (id: string, cambios: Partial<T>) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }))
}

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [navesNuevas, setNavesNuevas] = useState<Nave[]>([])
  const [navesOverrides, setNavesOverrides] = useState<OverrideMap<Nave>>({})
  const [documentos, setDocumentos] = useState<DocumentoPermiso[]>([])
  const [contratosOverrides, setContratosOverrides] = useState<OverrideMap<ContratoArrendamiento>>({})
  const [ordenesOverrides, setOrdenesOverrides] = useState<OverrideMap<OrdenTrabajo>>({})
  const [tareasOverrides, setTareasOverrides] = useState<OverrideMap<TareaOperativa>>({})
  const [capexOverrides, setCapexOverrides] = useState<OverrideMap<ProyectoCapex>>({})

  const naves = useMemo(
    () => aplicarOverrides([...navesBase, ...navesNuevas], navesOverrides),
    [navesNuevas, navesOverrides],
  )

  useEffect(() => {
    supabase
      .from('documentos')
      .select('*')
      .then(({ data }) => {
        if (data) setDocumentos(data.map(documentoDeFila))
      })
  }, [])

  const contratos = useMemo(() => aplicarOverrides(contratosBase, contratosOverrides), [contratosOverrides])
  const ordenesTrabajo = useMemo(() => aplicarOverrides(ordenesTrabajoBase, ordenesOverrides), [ordenesOverrides])
  const tareasOperativas = useMemo(() => aplicarOverrides(tareasOperativasBase, tareasOverrides), [tareasOverrides])
  const proyectosCapex = useMemo(() => aplicarOverrides(proyectosCapexBase, capexOverrides), [capexOverrides])

  const alertas = useMemo(() => calcularAlertas(documentos, contratos, ordenesTrabajo), [documentos, contratos, ordenesTrabajo])
  const tareasVivas = useMemo(() => calcularTareasVivas(ordenesTrabajo), [ordenesTrabajo])

  const value = useMemo<DataStoreContextValue>(() => {
    const capexAutorizadoTotal = capexAutorizadoTotalBase(proyectosCapex)
    return {
      naves,
      naveById: (id) => naveByIdBase(id, naves),
      agregarNave: (nave) => setNavesNuevas((prev) => [...prev, nave]),
      editarNave: crearEditor(setNavesOverrides),

      documentos,
      documentosPorNave: (naveId) => documentosPorNaveBase(naveId, documentos),
      editarDocumento: (id, cambios) => {
        setDocumentos((prev) => prev.map((d) => (d.id === id ? { ...d, ...cambios } : d)))
        // El query builder de Supabase es "thenable": solo dispara la petición real
        // cuando se le llama .then()/await — un `void` sobre la cadena sin eso nunca
        // manda la petición.
        supabase
          .from('documentos')
          .update(documentoAFila(cambios))
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Error al guardar documento en Supabase:', error.message)
          })
      },

      contratos,
      contratoPorNaveId: (naveId) => contratoPorNaveIdBase(naveId, contratos),
      editarContrato: crearEditor(setContratosOverrides),

      ordenesTrabajo,
      ordenesPorNave: (naveId) => ordenesPorNaveBase(naveId, ordenesTrabajo),
      editarOrden: crearEditor(setOrdenesOverrides),

      tareasOperativas,
      editarTarea: crearEditor(setTareasOverrides),

      proyectosCapex,
      proyectoCapexPorNave: (naveId) => proyectoCapexPorNaveBase(naveId, proyectosCapex),
      editarCapex: crearEditor(setCapexOverrides),
      capexAutorizadoTotal,
      capexDisponiblePct: capexDisponiblePctBase(proyectosCapex),

      alertas,
      tareasVivas,
      requerimientosCriticos: requerimientosCriticosBase(alertas),
      vencimientosContrato90Dias: vencimientosContrato90DiasBase(contratos),

      totalNaves: portafolioKpis.totalNaves(naves),
      navesOcupadas: portafolioKpis.navesOcupadas(naves),
      ocupacionGlobalPct: portafolioKpis.ocupacionGlobalPct(naves),
      glaTotal: portafolioKpis.glaTotal(naves),
      glaDisponible: portafolioKpis.glaDisponible(naves),
      ingresoMensualTotalUSD: portafolioKpis.ingresoMensualTotalUSD(contratos),
      cobranzaAlDiaPct: portafolioKpis.cobranzaAlDiaPct(contratos),
      certificacionesLEEDCount: portafolioKpis.certificacionesLEEDCount(naves),
      cumplimientoSTPSPromedio: portafolioKpis.cumplimientoSTPSPromedio(naves),
      desgloseIndustria: portafolioKpis.desgloseIndustria(naves),
      serieNOIAnual: portafolioKpis.serieNOIAnual(contratos),

      correctivosActivos: mantenimientoKpis.correctivosActivos(ordenesTrabajo),
      capexProyectosMayores: mantenimientoKpis.capexProyectosMayores(proyectosCapex),
      capexAutorizadoAnio: mantenimientoKpis.capexAutorizadoAnio(proyectosCapex),
      slaPromedioResolucionHoras: mantenimientoKpis.slaPromedioResolucionHoras(ordenesTrabajo),
      proyectoMayorEnCurso: mantenimientoKpis.proyectoMayorEnCurso(proyectosCapex),
    }
  }, [naves, documentos, contratos, ordenesTrabajo, tareasOperativas, proyectosCapex, alertas, tareasVivas])

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext)
  if (!ctx) throw new Error('useDataStore debe usarse dentro de DataStoreProvider')
  return ctx
}
