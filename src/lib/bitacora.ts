import { supabase } from '@/lib/supabaseClient'

// bitacora es inmutable (solo insert+select, sección RLS 0002) — cada llamada aquí es
// el único punto de escritura de auditoría de la app. Se dispara "fire and forget" para
// no bloquear la acción del usuario; un fallo de red aquí no debe tumbar la edición real.
export function registrarBitacora(entidad: string, entidadId: string, tipoEvento: string, descripcion: string) {
  supabase.auth.getUser().then(({ data }) => {
    supabase
      .from('bitacora')
      .insert({ entidad, entidad_id: entidadId, tipo_evento: tipoEvento, usuario_id: data.user?.id ?? null, descripcion })
      .then(({ error }) => {
        if (error) console.error('Error al registrar bitácora:', error.message)
      })
  })
}
