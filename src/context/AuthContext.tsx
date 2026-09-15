import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { registrarBitacora } from '@/lib/bitacora'
import type { Region } from '@/data'

export interface ProfileRow {
  id: string
  nombre: string
  correo: string
  puesto: string
  rol: 'Property Manager' | 'Facility Manager' | 'Dirección' | 'Contabilidad' | 'Administrador del Sistema' | 'Superadministrador'
  ambito_regiones: Region[]
  ambito_parques: string[]
  ambito_naves: string[]
  acceso_total: boolean
  activo: boolean
  avatar_iniciales: string
}

// Forma compatible con la antigua maqueta (PerfilSimulado) para que las pantallas que ya
// filtran por región/rol sigan funcionando sin cambios adicionales.
export interface PerfilActivo {
  nombre: string
  puesto: string
  rol: ProfileRow['rol']
  region: Region | 'todas'
  iniciales: string
}

function regionDesdeAmbito(profile: ProfileRow): Region | 'todas' {
  if (profile.rol === 'Superadministrador') return 'todas'
  if (profile.acceso_total) return 'todas'
  if (profile.ambito_regiones.length === 1) return profile.ambito_regiones[0]
  return 'todas'
}

interface AuthState {
  session: Session | null
  profile: ProfileRow | null
  perfilActivo: PerfilActivo
  loading: boolean
  signIn: (correo: string, password: string) => Promise<{ error: string | null }>
  signUp: (correo: string, password: string, nombre: string) => Promise<{ error: string | null; necesitaConfirmacion: boolean }>
  // SSO con Microsoft Entra ID (Fase 6l) — el App Registration del tenant grupodmi.com.mx
  // es de un solo inquilino, así que Microsoft ya rechaza cualquier cuenta fuera de ese
  // dominio antes de llegar aquí; no hace falta repetir esa validación en el cliente.
  signInWithAzure: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const PERFIL_CARGANDO: PerfilActivo = { nombre: 'Cargando…', puesto: '', rol: 'Property Manager', region: 'todas', iniciales: '…' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nuevaSesion) => {
      setSession(nuevaSesion)
      if (!nuevaSesion) {
        setProfile(null)
        setLoading(false)
      }
      // Único punto de registro de inicio de sesión: cubre tanto correo/contraseña como
      // el redirect de vuelta de Microsoft Entra ID (SSO), que no pasa por signIn().
      if (event === 'SIGNED_IN' && nuevaSesion) {
        registrarBitacora('auth', nuevaSesion.user.id, 'login', `Inicio de sesión: ${nuevaSesion.user.email ?? nuevaSesion.user.id}`)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelado = false
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return
        setProfile(data as ProfileRow | null)
        setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [session])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      perfilActivo: profile
        ? { nombre: profile.nombre, puesto: profile.puesto, rol: profile.rol, region: regionDesdeAmbito(profile), iniciales: profile.avatar_iniciales }
        : PERFIL_CARGANDO,
      loading,
      signIn: async (correo, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: correo, password })
        return { error: error?.message ?? null }
      },
      signUp: async (correo, password, nombre) => {
        const { data, error } = await supabase.auth.signUp({ email: correo, password, options: { data: { nombre } } })
        return { error: error?.message ?? null, necesitaConfirmacion: !error && !data.session }
      },
      signInWithAzure: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: { scopes: 'openid profile email', redirectTo: window.location.origin },
        })
        return { error: error?.message ?? null }
      },
      signOut: async () => {
        if (session) registrarBitacora('auth', session.user.id, 'logout', 'Cierre de sesión')
        await supabase.auth.signOut()
      },
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
