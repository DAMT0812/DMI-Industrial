import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabaseClient'
import type { ProfileRow } from '@/context/AuthContext'

const ROLES: ProfileRow['rol'][] = ['Property Manager', 'Facility Manager', 'Dirección', 'Contabilidad', 'Administrador del Sistema', 'Superadministrador']

// Fase 7a (Subfase 2/4): alta de usuario iniciada por un administrador, vía la Edge
// Function `invitar-usuario` — es la única operación de la app que necesita la Admin API
// de Supabase Auth (service role key), así que no puede resolverse con un simple insert
// desde el cliente como el resto de DataStoreContext.
export function InvitarUsuarioDialog({
  open,
  onOpenChange,
  onInvitado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvitado: () => void
}) {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<ProfileRow['rol']>('Property Manager')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  function reiniciar() {
    setEmail('')
    setNombre('')
    setRol('Property Manager')
    setError(null)
    setListo(false)
  }

  async function enviar() {
    if (!email.trim() || !nombre.trim()) {
      setError('Correo y nombre son obligatorios.')
      return
    }
    setEnviando(true)
    setError(null)
    const { data: sesion } = await supabase.auth.getSession()
    const { data, error: errorFuncion } = await supabase.functions.invoke('invitar-usuario', {
      body: { email: email.trim(), nombre: nombre.trim(), rol },
      headers: sesion.session ? { Authorization: `Bearer ${sesion.session.access_token}` } : undefined,
    })
    setEnviando(false)
    if (errorFuncion || data?.error) {
      setError(data?.error ?? errorFuncion?.message ?? 'No se pudo enviar la invitación.')
      return
    }
    setListo(true)
    onInvitado()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reiniciar()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>Se envía un correo de invitación para que la persona establezca su contraseña.</DialogDescription>
        </DialogHeader>
        {listo ? (
          <p className="py-2 text-sm text-status-success">Invitación enviada a {email}.</p>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invitar-nombre">Nombre completo</Label>
              <Input id="invitar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ing. Nombre Apellido" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invitar-correo">Correo institucional</Label>
              <Input id="invitar-correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@grupodmi.com.mx" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invitar-rol">Rol</Label>
              <select
                id="invitar-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as ProfileRow['rol'])}
                className="h-9 rounded-md border border-border bg-surface-secondary px-2 text-sm focus:border-brand-cobalt focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs text-status-danger">{error}</p>}
          </div>
        )}
        <DialogFooter>
          {listo ? (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => void enviar()} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar invitación'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
