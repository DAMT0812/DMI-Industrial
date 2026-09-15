import { useEffect, useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabaseClient'
import { useAuth, type ProfileRow } from '@/context/AuthContext'
import { esAdministrador } from '@/lib/permissions'
import { registrarBitacora } from '@/lib/bitacora'
import type { Region } from '@/data'

const ROLES: ProfileRow['rol'][] = ['Property Manager', 'Facility Manager', 'Dirección', 'Contabilidad', 'Administrador del Sistema', 'Superadministrador']
const REGIONES: Region[] = ['Bajío', 'Norte', 'Occidente']

type FilaEdicion = { rol: ProfileRow['rol']; region: Region | 'todas'; activo: boolean }

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

  useEffect(() => {
    if (!esAdministrador(perfilActivo.rol)) return
    supabase
      .from('profiles')
      .select('*')
      .order('nombre')
      .then(({ data }) => {
        const filas = (data as ProfileRow[] | null) ?? []
        setUsuarios(filas)
        setEdiciones(Object.fromEntries(filas.map((p) => [p.id, { rol: p.rol, region: regionDeFila(p), activo: p.activo }])))
      })
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
      .update({ rol: edicion.rol, acceso_total, ambito_regiones, activo: edicion.activo })
      .eq('id', id)
    if (!error) {
      setUsuarios((prev) => prev?.map((u) => (u.id === id ? { ...u, rol: edicion.rol, acceso_total, ambito_regiones, activo: edicion.activo } : u)) ?? null)
      const cambios: string[] = []
      if (anterior.rol !== edicion.rol) cambios.push(`rol: ${anterior.rol} → ${edicion.rol}`)
      if (regionDeFila(anterior) !== edicion.region) cambios.push(`ámbito: ${regionDeFila(anterior)} → ${edicion.region}`)
      if (anterior.activo !== edicion.activo) cambios.push(edicion.activo ? 'cuenta reactivada' : 'cuenta desactivada')
      if (cambios.length) registrarBitacora('profiles', id, 'edicion_usuario', `${anterior.nombre}: ${cambios.join(', ')}`)
    }
    setGuardandoId(null)
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Ámbito (Región)</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios === null && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Cargando usuarios…
                </TableCell>
              </TableRow>
            )}
            {usuarios?.map((u) => {
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
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={guardandoId === u.id} onClick={() => guardar(u.id)}>
                      {guardandoId === u.id ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
