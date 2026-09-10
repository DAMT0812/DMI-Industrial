import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { ContratoArrendamiento, DocumentoPermiso, Nave, OrdenTrabajo, ProyectoCapex, TareaOperativa } from '@/data/types'
import { naves as navesBase, naveById as naveByIdBase } from '@/data/naves'
import { documentos as documentosBase, documentosPorNave as documentosPorNaveBase } from '@/data/documentos'
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

function crearEditor<T>(setOverrides: Dispatch<SetStateAction<OverrideMap<T>>>) {
  return (id: string, cambios: Partial<T>) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }))
}

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [navesNuevas, setNavesNuevas] = useState<Nave[]>([])
  const [navesOverrides, setNavesOverrides] = useState<OverrideMap<Nave>>({})
  const [documentosOverrides, setDocumentosOverrides] = useState<OverrideMap<DocumentoPermiso>>({})
  const [contratosOverrides, setContratosOverrides] = useState<OverrideMap<ContratoArrendamiento>>({})
  const [ordenesOverrides, setOrdenesOverrides] = useState<OverrideMap<OrdenTrabajo>>({})
  const [tareasOverrides, setTareasOverrides] = useState<OverrideMap<TareaOperativa>>({})
  const [capexOverrides, setCapexOverrides] = useState<OverrideMap<ProyectoCapex>>({})

  const naves = useMemo(
    () => aplicarOverrides([...navesBase, ...navesNuevas], navesOverrides),
    [navesNuevas, navesOverrides],
  )
  const documentos = useMemo(() => aplicarOverrides(documentosBase, documentosOverrides), [documentosOverrides])
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
      editarDocumento: crearEditor(setDocumentosOverrides),

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
