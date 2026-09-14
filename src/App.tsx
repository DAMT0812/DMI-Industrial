import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { PreferencesProvider } from '@/context/PreferencesContext'
import { DataStoreProvider } from '@/context/DataStoreContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LoginPage } from '@/pages/LoginPage'
import { PortafolioPage } from '@/pages/PortafolioPage'
import { MantenimientoPage } from '@/pages/MantenimientoPage'
import { TareasCapexPage } from '@/pages/TareasCapexPage'
import { ExpedienteNavePage } from '@/pages/ExpedienteNavePage'

function AuthGate({ children }: { children: ReactNode }) {
  const { session, profile, loading, signOut } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Cargando…</div>
  }
  if (!session) {
    return <LoginPage />
  }
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Tu cuenta inició sesión pero no encontramos tu perfil interno. Contacta al Administrador del Sistema.
        </p>
        <button type="button" onClick={() => void signOut()} className="text-xs font-medium text-primary hover:underline">
          Cerrar sesión
        </button>
      </div>
    )
  }
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <DataStoreProvider>
          <TooltipProvider>
            <AuthGate>
              <BrowserRouter>
                <Routes>
                  <Route element={<AppShell />}>
                    <Route index element={<PortafolioPage />} />
                    <Route path="mantenimiento" element={<MantenimientoPage />} />
                    <Route path="tareas-capex" element={<TareasCapexPage />} />
                    <Route path="naves/:naveId" element={<ExpedienteNavePage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </AuthGate>
          </TooltipProvider>
        </DataStoreProvider>
      </PreferencesProvider>
    </AuthProvider>
  )
}

export default App
