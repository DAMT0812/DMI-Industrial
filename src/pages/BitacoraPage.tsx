import { useEffect, useState } from 'react'
import { History, Lock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useDataStore } from '@/context/DataStoreContext'
import { puedeVerBitacora } from '@/lib/permissions'

interface FilaBitacora {
  id: string
  entidad: string
  entidad_id: string
  tipo_evento: string
  usuario_id: string | null
  fecha_hora: string
  descripcion: string
}

const ENTIDADES: { value: string; label: string }[] = [
  { value: 'todas', label: 'Todas las entidades' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'profiles', label: 'Usuarios' },
  { value: 'auth', label: 'Sesiones' },
]

export function BitacoraPage() {
  const { perfilActivo } = useAuth()
  const { naves, documentos } = useDataStore()
  const puedeVer = puedeVerBitacora(perfilActivo.rol)
  const [entradas, setEntradas] = useState<FilaBitacora[] | null>(null)
  const [nombresPorId, setNombresPorId] = useState<Record<string, string>>({})
  const [filtroEntidad, setFiltroEntidad] = useState('todas')

  useEffect(() => {
    if (!puedeVer) return
    supabase
      .from('bitacora')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(200)
      .then(({ data }) => setEntradas((data as FilaBitacora[] | null) ?? []))
    supabase
      .from('profiles')
      .select('id,nombre')
      .then(({ data }) => {
        if (data) setNombresPorId(Object.fromEntries((data as { id: string; nombre: string }[]).map((p) => [p.id, p.nombre])))
      })
  }, [puedeVer])

  if (!puedeVer) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card py-20 text-center">
        <Lock className="h-8 w-8 text-status-danger" />
        <h2 className="text-headline-sm text-foreground">Sin acceso</h2>
        <p className="max-w-md text-sm text-muted-foreground">Esta sección es exclusiva de Dirección y del Administrador del Sistema.</p>
      </div>
    )
  }

  function contexto(fila: FilaBitacora): string {
    if (fila.entidad === 'documentos') {
      const doc = documentos.find((d) => d.id === fila.entidad_id)
      const nave = doc ? naves.find((n) => n.id === doc.naveId) : undefined
      if (doc && nave) return `${nave.folio} · ${doc.tipo}`
      return doc?.tipo ?? fila.entidad_id
    }
    if (fila.entidad === 'profiles' || fila.entidad === 'auth') return nombresPorId[fila.entidad_id] ?? fila.entidad_id
    return fila.entidad_id
  }

  const filtradas = (entradas ?? []).filter((f) => filtroEntidad === 'todas' || f.entidad === filtroEntidad)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-cobalt">
          <History className="h-4 w-4" />
          Auditoría
        </div>
        <h1 className="mt-1 text-headline-lg-mobile sm:text-headline-lg text-primary">Bitácora del Sistema</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registro inmutable de altas, ediciones y accesos — últimos 200 eventos.</p>
      </div>

      <select
        value={filtroEntidad}
        onChange={(e) => setFiltroEntidad(e.target.value)}
        className="h-8 w-fit rounded-md border border-border bg-surface-secondary px-2 text-xs focus:border-brand-cobalt focus:outline-none"
      >
        {ENTIDADES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Contexto</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entradas === null && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Cargando bitácora…
                </TableCell>
              </TableRow>
            )}
            {entradas !== null && filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Sin eventos registrados.
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="tabular whitespace-nowrap text-xs text-muted-foreground">{new Date(f.fecha_hora).toLocaleString('es-MX')}</TableCell>
                <TableCell className="text-xs text-foreground">{f.usuario_id ? (nombresPorId[f.usuario_id] ?? '—') : 'Sistema'}</TableCell>
                <TableCell className="text-xs capitalize text-muted-foreground">{f.entidad}</TableCell>
                <TableCell className="text-xs text-foreground">{contexto(f)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{f.tipo_evento}</TableCell>
                <TableCell className="text-xs text-foreground">{f.descripcion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
