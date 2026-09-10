import { Bell, Search, UserCog } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PillToggle } from '@/components/shared/ToggleGroup'
import { MobileSidebar } from '@/components/layout/Sidebar'
import { usePreferences } from '@/context/PreferencesContext'
import { useDataStore } from '@/context/DataStoreContext'
import { perfilesSimulados } from '@/data'

export function Topbar() {
  const { moneda, setMoneda, unidad, setUnidad, perfilSimulado, setPerfilSimulado } = usePreferences()
  const { alertas } = useDataStore()
  const notificacionesPendientes = alertas.filter((a) => a.estatus === 'Pendiente').length

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <MobileSidebar />

      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar nave, inquilino, folio o ticket…"
          className="h-9 w-full rounded-md border border-border bg-surface-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-cobalt focus:bg-card focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <PillToggle
          value={moneda}
          options={[
            { value: 'USD', label: 'USD' },
            { value: 'MXN', label: 'MXN' },
          ]}
          onChange={setMoneda}
        />
        <div className="hidden sm:block">
          <PillToggle
            value={unidad}
            options={[
              { value: 'm2', label: 'm²' },
              { value: 'sqft', label: 'sq ft' },
            ]}
            onChange={setUnidad}
          />
        </div>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-surface-secondary hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {notificacionesPendientes > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-status-danger ring-2 ring-card" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md py-1 pr-1 pl-2 hover:bg-surface-secondary">
            <div className="hidden text-right leading-tight lg:block">
              <div className="text-sm font-semibold text-foreground">{perfilSimulado.nombre}</div>
              <div className="text-[11px] text-muted-foreground">{perfilSimulado.puesto}</div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {perfilSimulado.iniciales}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{perfilSimulado.nombre}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                <UserCog className="h-3 w-3" />
                Ver como (simulación de rol)
              </DropdownMenuLabel>
              {perfilesSimulados.map((p) => (
                <DropdownMenuItem key={p.clave} onClick={() => setPerfilSimulado(p.clave)}>
                  <span className={p.clave === perfilSimulado.clave ? 'font-semibold text-primary' : ''}>
                    {p.nombre} — {p.puesto}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
