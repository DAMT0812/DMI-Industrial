import { useState } from 'react'
import { Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import { useDataStore } from '@/context/DataStoreContext'
import { esAdministrador, esSuperAdministrador, CATALOGO_PERMISOS } from '@/lib/permissions'

// Fase 7a (Subfase 4/4): administración de roles y permisos vía UI, sin tocar código ni
// desplegar una migración — roles/permisos_por_rol (0019) + RLS reescrito con
// tiene_permiso() (0020) en vez de listas de rol hardcodeadas.
export function RolesPage() {
  const { perfilActivo } = useAuth()
  const { roles, permisosPorRol, crearRol, eliminarRol, renombrarRol, otorgarPermiso, revocarPermiso } = useDataStore()

  const [nuevoRol, setNuevoRol] = useState('')
  const [creando, setCreando] = useState(false)
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null)
  const [renombrando, setRenombrando] = useState<string | null>(null)
  const [nombreNuevo, setNombreNuevo] = useState('')

  if (!esAdministrador(perfilActivo.rol)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-20 text-center">
        <Lock className="h-8 w-8 text-status-danger" />
        <h2 className="text-headline-sm text-foreground">Sin acceso</h2>
        <p className="max-w-md text-sm text-muted-foreground">Esta sección es exclusiva del Administrador del Sistema.</p>
      </div>
    )
  }

  async function onCrearRol() {
    const nombre = nuevoRol.trim()
    if (!nombre) return
    setCreando(true)
    setErrorCatalogo(null)
    const { error } = await crearRol(nombre)
    setCreando(false)
    if (error) {
      setErrorCatalogo(error)
      return
    }
    setNuevoRol('')
  }

  async function onEliminarRol(nombre: string) {
    const { error } = await eliminarRol(nombre)
    setConfirmandoEliminar(null)
    if (error) setErrorCatalogo(error)
  }

  async function onGuardarRenombrado(nombreActual: string) {
    const nombre = nombreNuevo.trim()
    if (!nombre || nombre === nombreActual) {
      setRenombrando(null)
      return
    }
    const { error } = await renombrarRol(nombreActual, nombre)
    if (error) {
      setErrorCatalogo(error)
      return
    }
    setRenombrando(null)
  }

  const rolesOrdenados = [...roles].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const tienePermisoAsignado = (rol: string, permiso: string) => permisosPorRol.some((p) => p.rol === rol && p.permiso === permiso)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-cobalt">
          <ShieldCheck className="h-4 w-4" />
          Administración del Sistema
        </div>
        <h1 className="mt-1 text-headline-lg-mobile sm:text-headline-lg text-primary">Roles y Permisos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea roles nuevos y decide qué puede hacer cada uno — sin escribir código. Los roles de sistema (los 6 originales) no se
          pueden eliminar ni renombrar porque su nombre exacto está referenciado en otras partes de la plataforma.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Catálogo de roles</h2>
        <div className="mb-4 flex items-end gap-2">
          <div className="flex-1 max-w-xs">
            <Input
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value)}
              placeholder="Ej. Auditor Externo"
              onKeyDown={(e) => e.key === 'Enter' && onCrearRol()}
            />
          </div>
          <Button size="sm" className="gap-1.5" disabled={creando || !nuevoRol.trim()} onClick={onCrearRol}>
            <Plus className="h-3.5 w-3.5" />
            Crear rol
          </Button>
        </div>
        {errorCatalogo && <p className="mb-3 text-xs text-status-danger">{errorCatalogo}</p>}

        <ul className="flex flex-col gap-1.5">
          {rolesOrdenados.map((r) => (
            <li key={r.nombre} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              {renombrando === r.nombre ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} className="h-8 max-w-xs" autoFocus />
                  <Button size="sm" className="h-7 text-xs" onClick={() => onGuardarRenombrado(r.nombre)}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRenombrando(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{r.nombre}</span>
                    {r.esSistema && <Badge variant="secondary">Rol de sistema</Badge>}
                  </div>
                  {!r.esSistema &&
                    (confirmandoEliminar === r.nombre ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-status-danger" onClick={() => onEliminarRol(r.nombre)}>
                          Sí
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmandoEliminar(null)}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="h-7 w-7"
                          aria-label="Renombrar rol"
                          onClick={() => {
                            setRenombrando(r.nombre)
                            setNombreNuevo(r.nombre)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="h-7 w-7 text-status-danger"
                          aria-label="Eliminar rol"
                          onClick={() => setConfirmandoEliminar(r.nombre)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Matriz de permisos</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Superadministrador siempre tiene acceso total — no depende de esta tabla, por diseño.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permiso</TableHead>
                {rolesOrdenados.map((r) => (
                  <TableHead key={r.nombre} className="text-center whitespace-nowrap">
                    {r.nombre}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CATALOGO_PERMISOS.map((p) => (
                <TableRow key={p.clave}>
                  <TableCell className="text-sm text-foreground">
                    {p.etiqueta}
                    {p.soloRls && <span className="ml-1 text-xs text-muted-foreground">(solo base de datos)</span>}
                  </TableCell>
                  {rolesOrdenados.map((r) => (
                    <TableCell key={r.nombre} className="text-center">
                      {esSuperAdministrador(r.nombre) ? (
                        <span className="text-[11px] text-muted-foreground">Acceso total</span>
                      ) : (
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={tienePermisoAsignado(r.nombre, p.clave)}
                          onChange={(e) => (e.target.checked ? otorgarPermiso(r.nombre, p.clave) : revocarPermiso(r.nombre, p.clave))}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
