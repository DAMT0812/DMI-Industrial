import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PreferencesProvider } from '@/context/PreferencesContext'
import { NavesProvider } from '@/context/NavesContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PortafolioPage } from '@/pages/PortafolioPage'
import { MantenimientoPage } from '@/pages/MantenimientoPage'
import { TareasCapexPage } from '@/pages/TareasCapexPage'
import { ExpedienteNavePage } from '@/pages/ExpedienteNavePage'

function App() {
  return (
    <PreferencesProvider>
      <NavesProvider>
        <TooltipProvider>
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
        </TooltipProvider>
      </NavesProvider>
    </PreferencesProvider>
  )
}

export default App
