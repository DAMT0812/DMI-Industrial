import { useState, type FormEvent } from 'react'
import { LogoMark } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

export function LoginPage() {
  const { signIn, signUp, signInWithAzure } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [redirigiendoAzure, setRedirigiendoAzure] = useState(false)

  async function onAzureClick() {
    setError(null)
    setRedirigiendoAzure(true)
    // signInWithOAuth redirige la pestaña completa a Microsoft si tiene éxito, así que
    // esta promesa solo resuelve con datos cuando algo salió mal antes de redirigir.
    const { error } = await signInWithAzure()
    if (error) {
      setError(error)
      setRedirigiendoAzure(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    setEnviando(true)

    if (modo === 'entrar') {
      const { error } = await signIn(correo, password)
      if (error) setError(error)
    } else {
      const { error, necesitaConfirmacion } = await signUp(correo, password, nombre.trim())
      if (error) {
        setError(error)
      } else if (necesitaConfirmacion) {
        setAviso('Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.')
        setModo('entrar')
      }
    }

    setEnviando(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary">
            <LogoMark className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">DMI Industrial</div>
            <div className="text-xs text-muted-foreground">Asset Management</div>
          </div>
        </div>

        <h1 className="text-center text-headline-sm text-foreground">{modo === 'entrar' ? 'Inicia sesión' : 'Crear cuenta interna'}</h1>
        <p className="mt-1 mb-5 text-center text-xs text-muted-foreground">
          {modo === 'entrar'
            ? 'Usa tu cuenta @grupodmi.com.mx, o entra con correo y contraseña.'
            : 'Acceso temporal por correo y contraseña mientras se activa el inicio de sesión único.'}
        </p>

        {modo === 'entrar' && (
          <>
            <Button
              type="button"
              variant="outline"
              className="mb-4 w-full gap-2"
              disabled={redirigiendoAzure}
              onClick={() => void onAzureClick()}
            >
              <MicrosoftLogo className="h-4 w-4" />
              {redirigiendoAzure ? 'Redirigiendo a Microsoft…' : 'Iniciar sesión con Microsoft'}
            </Button>
            <div className="mb-4 flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              o con correo y contraseña
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {modo === 'crear' && (
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nombre completo</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Sofía Zamora Villasante" />
            </div>
          )}
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Correo institucional</Label>
            <Input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required placeholder="tu.nombre@grupodmi.com.mx" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <p className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger">{error}</p>}
          {aviso && <p className="rounded-md bg-status-success-bg px-3 py-2 text-xs text-status-success">{aviso}</p>}

          <Button type="submit" className="mt-1" disabled={enviando}>
            {enviando ? 'Enviando…' : modo === 'entrar' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModo((m) => (m === 'entrar' ? 'crear' : 'entrar'))
            setError(null)
            setAviso(null)
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {modo === 'entrar' ? '¿Primera vez? Crea tu cuenta interna' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
