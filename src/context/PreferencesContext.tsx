import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Moneda, UnidadSuperficie } from '@/lib/format'
import { perfilPorClave, type ClavePerfil, type PerfilSimulado } from '@/data/perfilesSimulados'

interface PreferencesState {
  moneda: Moneda
  unidad: UnidadSuperficie
  setMoneda: (m: Moneda) => void
  setUnidad: (u: UnidadSuperficie) => void
  sidebarColapsado: boolean
  toggleSidebar: () => void
  parqueSeleccionado: string | 'todos'
  setParqueSeleccionado: (id: string | 'todos') => void
  perfilSimulado: PerfilSimulado
  setPerfilSimulado: (clave: ClavePerfil) => void
}

const PreferencesContext = createContext<PreferencesState | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [moneda, setMoneda] = useState<Moneda>('USD')
  const [unidad, setUnidad] = useState<UnidadSuperficie>('m2')
  const [sidebarColapsado, setSidebarColapsado] = useState(false)
  const [parqueSeleccionado, setParqueSeleccionado] = useState<string | 'todos'>('todos')
  const [claveSimulada, setClaveSimulada] = useState<ClavePerfil>('direccion')

  const value = useMemo<PreferencesState>(
    () => ({
      moneda,
      unidad,
      setMoneda,
      setUnidad,
      sidebarColapsado,
      toggleSidebar: () => setSidebarColapsado((v) => !v),
      parqueSeleccionado,
      setParqueSeleccionado,
      perfilSimulado: perfilPorClave(claveSimulada),
      setPerfilSimulado: setClaveSimulada,
    }),
    [moneda, unidad, sidebarColapsado, parqueSeleccionado, claveSimulada],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences debe usarse dentro de PreferencesProvider')
  return ctx
}
