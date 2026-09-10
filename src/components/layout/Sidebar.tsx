import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Building2, ClipboardList, FolderOpenDot, Menu, PanelLeftClose, PanelLeftOpen, Wrench } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { parques, parqueById } from '@/data'
import { cn } from '@/lib/utils'

// Nave representativa por región — así el atajo de "Expediente Digital 360°"
// siempre abre algo dentro del alcance del perfil simulado activo.
const NAVE_REPRESENTATIVA_POR_REGION: Record<string, string> = {
  Bajío: 'NAVE-04',
  Norte: 'NAVE-06',
  Occidente: 'NAVE-01',
  todas: 'NAVE-01',
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { parqueSeleccionado, setParqueSeleccionado, perfilSimulado } = usePreferences()
  const { ocupacionGlobalPct: ocupacion } = useDataStore()

  const navItems = [
    { to: '/', label: 'Portafolio de Naves', icon: Building2, end: true },
    { to: '/mantenimiento', label: 'Mantenimiento & SLAs', icon: Wrench, end: false },
    {
      to: `/naves/${NAVE_REPRESENTATIVA_POR_REGION[perfilSimulado.region]}`,
      label: 'Expediente Digital 360°',
      icon: FolderOpenDot,
      end: false,
    },
    { to: '/tareas-capex', label: 'Centro de Tareas & CapEx', icon: ClipboardList, end: false },
  ]

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Logo collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="px-4 pb-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Portafolio Activo</div>
          <Select value={parqueSeleccionado} onValueChange={(v) => v && setParqueSeleccionado(v)}>
            <SelectTrigger className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-foreground data-[placeholder]:text-slate-400 [&_svg]:text-slate-400">
              <SelectValue>
                {(v: string) => (v === 'todos' ? `Todos los Parques (${parques.length})` : (parqueById(v)?.nombre ?? v))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Parques ({parques.length})</SelectItem>
              {parques.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3">
        {!collapsed && <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Operaciones & Asset Mgmt</div>}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center',
                  isActive ? 'bg-sidebar-accent text-white' : 'text-slate-300 hover:bg-sidebar-accent/60 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-md bg-sidebar-accent/50 px-3 py-2.5">
            <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              <span>Tasa de Ocupación</span>
              <span className="tabular text-white">{ocupacion}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand-cobalt" style={{ width: `${ocupacion}%` }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
              En línea · build 1.0.0
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const { sidebarColapsado, toggleSidebar } = usePreferences()

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
        sidebarColapsado ? 'w-[68px]' : 'w-[260px]',
      )}
    >
      <SidebarBody collapsed={sidebarColapsado} />
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute right-2 bottom-3 rounded-md p-1.5 text-slate-400 hover:bg-sidebar-accent hover:text-white"
        aria-label="Colapsar menú"
      >
        {sidebarColapsado ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-secondary lg:hidden"
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-4 w-4" />
      </button>
      <SheetContent side="left" showCloseButton={false} className="flex w-[260px] flex-col border-sidebar-border bg-sidebar p-0 sm:max-w-[260px]">
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        <SidebarBody collapsed={false} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
