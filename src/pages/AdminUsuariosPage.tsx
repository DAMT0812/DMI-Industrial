import { useEffect, useState } from 'react'
import { Lock, RotateCcw, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InvitarUsuarioDialog } from '@/components/admin/InvitarUsuarioDialog'
import { supabase } from '@/lib/supabaseClient'
import { useAuth, type ProfileRow } from '@/context/AuthContext'
import { esAdministrador } from '@/lib/permissions'
import { registrarBitacora } from '@/lib/bitacora'
import type { Region } from '@/data'

const ROLES: ProfileRow['rol'][] = ['Property Manager', 'Facility Manager', 'Dirección', 'Contabilidad', 'Administrador del Sistema', 'Superadministrador']
const REGIONES: Region[] = ['Bajío', 'Norte', 'Occidente']

type FilaEdicion = { rol: ProfileRow['rol']; region: Region | 'todas'; activo: boolean; bloqueado: boolean }

function regionDeFila(p: ProfileRow): Region | 'todas' {
  if (p.rol === 'Superadministrador' || p.rol === 'Dirección') return 'todas'
  if (p.acceso_total) return 'todas'
  if (p.ambito_regiones.length === 1) return p.ambito_regiones[0]
  return 'todas'
}

export function AdminUsuariosPage() {
  const { perfilActivo, profile: miPerfil } = useAuth()
  const [usuarios, setUsuarios] = useState<ProfileRow[] | null>(null)
  const [ediciones, setEdiciones] = useState<Record<string, FilaEdicion>>({})
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null)
  const [procesandoBajaId, setProcesandoBajaId] = useState<string | null>(null)
  const [mostrarEliminados, setMostrarEliminados] = useState(false)
  const [invitarAbierto, setInvitarAbierto] = useState(false)

  function cargarUsuarios() {
    supabase
      .from('profiles')
      .select('*')
      .order('nombre')
      .then(({ data }) => {
        const filas = (data as ProfileRow[] | null) ?? []
        setUsuarios(filas)
        setEdiciones(Object.fromEntries(filas.map((p) => [p.id, { rol: p.rol, region: regionDeFila(p), activo: p.activo, bloqueado: p.bloqueado }])))
      })
  }

  useEffect(() => {
    if (!esAdministrador(perfilActivo.rol)) return
    cargarUsuarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfilActivo.rol])

  if (!esAdministrador(perfilActivo.rol)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-20 text-center">
        <Lock className="h-8 w-8 text-status-danger" />
        <h2 className="text-headline-sm text-foreground">Sin acceso</h2>
        <p className="max-w-md text-sm text-muted-foreground">Esta sección es exclusiva del Administrador del Sistema.</p>
      </div>
    )
  }

  async function guardar(id: string) {
    const edicion = ediciones[id]
    const anterior = usuarios?.find((u) => u.id === id)
    if (!edicion || !anterior) return
    setGuardandoId(id)
    const acceso_total = edicion.region === 'todas'
    const ambito_regiones = acceso_total ? [] : [edicion.region as Region]
    const { error } = await supabase
      .from('profiles')
      .update({ rol: edicion.rol, acceso_total, ambito_regiones, activo: edicion.activo, bloqueado: edicion.bloqueado })
      .eq('id', id)
    if (!error) {
      setUsuarios(
        (prev) =>
          prev?.map((u) =>
            u.id === id ? { ...u, rol: edicion.rol, acceso_total, ambito_regiones, activo: edicion.activo, bloqueado: edicion.bloqueado } : u,
          ) ?? null,
      )
      const cambios: string[] = []
      if (anterior.rol !== edicion.rol) cambios.push(`rol: ${anterior.rol} → ${edicion.rol}`)
      if (regionDeFila(anterior) !== edicion.region) cambios.push(`ámbito: ${regionDeFila(anterior)} → ${edicion.region}`)
      if (anterior.activo !== edicion.activo) cambios.push(edicion.activo ? 'cuenta reactivada' : 'cuenta desactivada')
      if (anterior.bloqueado !== edicion.bloqueado) cambios.push(edicion.bloqueado ? 'cuenta bloqueada' : 'cuenta desbloqueada')
      if (cambios.length) registrarBitacora('profiles', id, 'edicion_usuario', `${anterior.nombre}: ${cambios.join(', ')}`)
    }
    setGuardandoId(null)
  }

  // Baja lógica (Fase 7a, distinta de "desactivar"): nunca se borra la fila — se marca
  // eliminado=true y, para no dejar una cuenta "eliminada" con acceso, también activo=false.
  // Se oculta del listado principal (mostrarEliminados la revela) y no se reactiva con el
  // checkbox de "Activo": requiere el botón explícito "Restaurar".
  async function eliminarUsuario(id: string) {
    const anterior = usuarios?.find((u) => u.id === id)
    if (!anterior) return
    setProcesandoBajaId(id)
    const { error } = await supabase.from('profiles').update({ eliminado: true, activo: false }).eq('id', id)
    if (!error) {
      setUsuarios((prev) => prev?.map((u) => (u.id === id ? { ...u, eliminado: true, activo: false } : u)) ?? null)
      setEdiciones((prev) => ({ ...prev, [id]: { ...prev[id], activo: false } }))
      registrarBitacora('profiles', id, 'baja_usuario', `${anterior.nombre}: dado de baja (eliminación lógica)`)
    }
    setProcesandoBajaId(null)
    setConfirmandoEliminarId(null)
  }

  async function restaurarUsuario(id: string) {
    const anterior = usuarios?.find((u) => u.id === id)
    if (!anterior) return
    setProcesandoBajaId(id)
    const { error } = await supabase.from('profiles').update({ eliminado: false }).eq('id', id)
    if (!error) {
      setUsuarios((prev) => prev?.map((u) => (u.id === id ? { ...u, eliminado: false } : u)) ?? null)
      registrarBitacora('profiles', id, 'restauracion_usuario', `${anterior.nombre}: restaurado (sigue inactivo hasta reactivarlo)`)
    }
    setProcesandoBajaId(null)
  }

  const visibles = usuarios?.filter((u) => !u.eliminado) ?? null
  const eliminados = usuarios?.filter((u) => u.eliminado) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-cobalt">
            <ShieldCheck className="h-4 w-4" />
            Administración del Sistema
          </div>
          <h1 className="mt-1 text-headline-lg-mobile sm:text-headline-lg text-primary">Usuarios Internos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigna rol y ámbito (región) a cada persona. El ámbito controla qué naves, contratos y tareas puede ver y editar.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setInvitarAbierto(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Invitar Usuario
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Ámbito (Región)</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Bloqueado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles === null && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Cargando usuarios…
                </TableCell>
              </TableRow>
            )}
            {visibles?.map((u) => {
              const edicion = ediciones[u.id]
              if (!edicion) return null
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.nombre}
                    {u.id === miPerfil?.id && <span className="ml-1.5 text-[10px] text-muted-foreground">(tú)</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.correo}</TableCell>
                  <TableCell>
                    <select
                      value={edicion.rol}
                      onChange={(e) => setEdiciones((prev) => ({ ...prev, [u.id]: { ...edicion, rol: e.target.value as ProfileRow['rol'] } }))}
                      className="h-8 rounded-md border border-border bg-surface-secondary px-2 text-xs focus:border-brand-cobalt focus:outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      value={edicion.region}
                      onChange={(e) => setEdiciones((prev) => ({ ...prev, [u.id]: { ...edicion, region: e.target.value as Region | 'todas' } }))}
                      className="h-8 rounded-md border border-border bg-surface-secondary px-2 text-xs focus:border-brand-cobalt focus:outline-none"
                    >
                      <option value="todas">Todas las regiones</option>
                      {REGIONES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={edicion.activo}
                      onChange={(e) => setEdiciones((prev) => ({ ...prev, [u.id]: { ...edicion, activo: e.target.checked } }))}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={edicion.bloqueado}
                      onChange={(e) => setEdiciones((prev) => ({ ...prev, [u.id]: { ...edicion, bloqueado: e.target.checked } }))}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {confirmandoEliminarId === u.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-status-danger"
                          disabled={procesandoBajaId === u.id}
                          onClick={() => eliminarUsuario(u.id)}
                        >
                          Sí
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmandoEliminarId(null)}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={guardandoId === u.id} onClick={() => guardar(u.id)}>
                          {guardandoId === u.id ? 'Guardando…' : 'Guardar'}
                        </Button>
                        {u.id !== miPerfil?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-status-danger"
                            title="Eliminar usuario"
                            onClick={() => setConfirmandoEliminarId(u.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {eliminados.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-xs font-medium text-muted-foreground underline decoration-dotted hover:text-foreground"
            onClick={() => setMostrarEliminados((v) => !v)}
          >
            {mostrarEliminados ? 'Ocultar' : 'Mostrar'} {eliminados.length} usuario{eliminados.length === 1 ? '' : 's'} eliminado{eliminados.length === 1 ? '' : 's'}
          </button>
          {mostrarEliminados && (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eliminados.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-muted-foreground">{u.nombre}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.correo}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.rol}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          disabled={procesandoBajaId === u.id}
                          onClick={() => restaurarUsuario(u.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <InvitarUsuarioDialog open={invitarAbierto} onOpenChange={setInvitarAbierto} onInvitado={cargarUsuarios} />
    </div>
  )
}
