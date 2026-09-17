import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabaseClient'
import { registrarBitacora } from '@/lib/bitacora'
import { useAuth } from '@/context/AuthContext'

export function CambiarContrasenaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { session } = useAuth()
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  function reiniciar() {
    setNueva('')
    setConfirmacion('')
    setError(null)
    setListo(false)
  }

  async function guardar() {
    if (nueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setGuardando(true)
    const { error: errorSupabase } = await supabase.auth.updateUser({ password: nueva })
    setGuardando(false)
    if (errorSupabase) {
      setError(errorSupabase.message)
      return
    }
    if (session) registrarBitacora('auth', session.user.id, 'cambio_password', 'Cambio de contraseña (autoservicio)')
    setListo(true)
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
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>Se cierra la sesión en otros dispositivos al confirmar.</DialogDescription>
        </DialogHeader>
        {listo ? (
          <p className="py-2 text-sm text-status-success">Contraseña actualizada correctamente.</p>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nueva-password">Nueva contraseña</Label>
              <Input id="nueva-password" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmar-password">Confirmar contraseña</Label>
              <Input
                id="confirmar-password"
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="new-password"
              />
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
              <Button size="sm" onClick={() => void guardar()} disabled={guardando || !nueva || !confirmacion}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
