import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Nave } from '@/data'

interface NavesContextState {
  navesNuevas: Nave[]
  agregarNave: (nave: Nave) => void
}

const NavesContext = createContext<NavesContextState | null>(null)

// Altas de inmueble hechas en esta sesión del navegador — en memoria, sin
// persistencia. Se combinan con el catálogo base de 19 naves solo en el
// Directorio del Portafolio; los KPIs agregados (ocupación, GLA, etc.) no
// se recalculan a partir de ellas, ya que hoy se calculan una sola vez sobre
// el catálogo estático — ver nota en el resumen de la Fase 4.
export function NavesProvider({ children }: { children: ReactNode }) {
  const [navesNuevas, setNavesNuevas] = useState<Nave[]>([])

  const value = useMemo<NavesContextState>(
    () => ({
      navesNuevas,
      agregarNave: (nave) => setNavesNuevas((prev) => [...prev, nave]),
    }),
    [navesNuevas],
  )

  return <NavesContext.Provider value={value}>{children}</NavesContext.Provider>
}

export function useNavesNuevas() {
  const ctx = useContext(NavesContext)
  if (!ctx) throw new Error('useNavesNuevas debe usarse dentro de NavesProvider')
  return ctx
}
