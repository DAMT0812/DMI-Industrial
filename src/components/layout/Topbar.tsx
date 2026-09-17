import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ClipboardList, FileText, KeyRound, LogOut, Search } from 'lucide-react'
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
import { useDataStore } from '@/context/DataStoreContext'
import { useAuth } from '@/context/AuthContext'

interface ResultadoBusqueda {
  tipo: 'Nave' | 'Inquilino' | 'Orden'
  etiqueta: string
  detalle: string
  ir: () => void
}

function useBusquedaGlobal(consulta: string) {
  const navigate = useNavigate()
  const { naves, parqueById, contratos, inquilinos, ordenesTrabajo } = useDataStore()

  return useMemo<ResultadoBusqueda[]>(() => {
    const q = consulta.trim().toLowerCase()
    if (q.length < 2) return []

    const resultados: ResultadoBusqueda[] = []

    for (const nave of naves) {
      const parque = parqueById(nave.parqueId)
      if (nave.folio.toLowerCase().includes(q) || parque?.nombre.toLowerCase().includes(q)) {
        resultados.push({
          tipo: 'Nave',
          etiqueta: nave.folio,
          detalle: parque?.nombre ?? nave.parqueId,
          ir: () => navigate(`/naves/${nave.id}`),
        })
      }
    }

    for (const inquilino of inquilinos) {
      if (inquilino.razonSocial.toLowerCase().includes(q) || inquilino.nombreComercial.toLowerCase().includes(q)) {
        const contrato = contratos.find((c) => c.inquilinoId === inquilino.id)
        if (!contrato) continue
        const nave = naves.find((n) => n.id === contrato.naveId)
        resultados.push({
          tipo: 'Inquilino',
          etiqueta: inquilino.nombreComercial,
          detalle: nave ? `${nave.folio}` : 'Sin nave asignada',
          ir: () => navigate(`/naves/${contrato.naveId}`, { state: { tab: 'contrato' } }),
        })
      }
    }

    for (const orden of ordenesTrabajo) {
      if (orden.folio.toLowerCase().includes(q) || orden.categoria.toLowerCase().includes(q)) {
        const nave = naves.find((n) => n.id === orden.naveId)
        resultados.push({
          tipo: 'Orden',
          etiqueta: orden.folio,
          detalle: `${orden.categoria} — ${nave?.folio ?? orden.naveId}`,
          ir: () => navigate('/mantenimiento', { state: { ordenId: orden.id } }),
        })
      }
    }

    return resultados.slice(0, 8)
  }, [consulta, naves, parqueById, contratos, inquilinos, ordenesTrabajo, navigate])
}

const ICONO_POR_TIPO: Record<ResultadoBusqueda['tipo'], typeof Building2> = {
  Nave: Building2,
  Inquilino: FileText,
  Orden: ClipboardList,
}

function BuscadorGlobal() {
  const [consulta, setConsulta] = useState('')
  const [abierto, setAbierto] = useState(false)
  const resultados = useBusquedaGlobal(consulta)

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={consulta}
        onChange={(e) => {
          setConsulta(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder="Buscar nave, inquilino, folio o ticket…"
        className="h-9 w-full rounded-md border border-border bg-surface-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-cobalt focus:bg-card focus:outline-none"
      />
      {abierto && consulta.trim().length >= 2 && (
        <div className="absolute top-full left-0 z-30 mt-1.5 w-full min-w-[280px] overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">Sin resultados para "{consulta}".</p>
          ) : (
            resultados.map((r, idx) => {
              const Icono = ICONO_POR_TIPO[r.tipo]
              return (
                <button
                  key={`${r.tipo}-${idx}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    r.ir()
                    setConsulta('')
                    setAbierto(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-secondary"
                >
                  <Icono className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{r.etiqueta}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.detalle}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{r.tipo}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function Topbar() {
  const { moneda, setMoneda, unidad, setUnidad } = usePreferences()
  const { perfilActivo, signOut } = useAuth()
  const [cambiarPasswordAbierto, setCambiarPasswordAbierto] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <MobileSidebar />

      <BuscadorGlobal />

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
