import { useState } from 'react'
import { KeyRound, LogOut, Search } from 'lucide-react'
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
import { NotificacionesMenu } from '@/components/layout/NotificacionesMenu'
import { CambiarContrasenaDialog } from '@/components/layout/CambiarContrasenaDialog'
import { usePreferences } from '@/context/PreferencesContext'
import { useAuth } from '@/context/AuthContext'

export function Topbar() {
  const { moneda, setMoneda, unidad, setUnidad } = usePreferences()
  const { perfilActivo, signOut } = useAuth()
  const [cambiarPasswordAbierto, setCambiarPasswordAbierto] = useState(false)

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

        <NotificacionesMenu />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md py-1 pr-1 pl-2 hover:bg-surface-secondary">
            <div className="hidden text-right leading-tight lg:block">
              <div className="text-sm font-semibold text-foreground">{perfilActivo.nombre}</div>
              <div className="text-[11px] text-muted-foreground">{perfilActivo.puesto}</div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {perfilActivo.iniciales}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{perfilActivo.nombre}</DropdownMenuLabel>
              <DropdownMenuLabel className="-mt-2 text-[11px] font-normal text-muted-foreground">{perfilActivo.rol}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setCambiarPasswordAbierto(true)}>
                <KeyRound className="h-3.5 w-3.5" />
                Cambiar contraseña
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void signOut()} className="text-status-danger">
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CambiarContrasenaDialog open={cambiarPasswordAbierto} onOpenChange={setCambiarPasswordAbierto} />
    </header>
  )
}
