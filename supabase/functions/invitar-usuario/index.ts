// Fase 7a (Subfase 2/4 de la auditoría de administración empresarial): primera Edge
// Function del proyecto. Invitar a alguien por correo requiere la Admin API de
// Supabase Auth (auth.admin.inviteUserByEmail), que solo funciona con la service role
// key — esa clave nunca puede vivir en el cliente, así que este flujo no puede hacerse
// desde DataStoreContext/AdminUsuariosPage como todo lo demás en la app.
//
// Autorización: se valida el JWT de quien llama (no la service role key, que bypassa
// RLS) contra su propia fila en profiles, exigiendo Administrador del Sistema o
// Superadministrador con activo=true — el mismo criterio que ya usa esAdministrador()
// en el cliente (src/lib/permissions.ts), reimplementado aquí porque una Edge Function
// no puede importar código del bundle de Vite.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ROLES_QUE_PUEDEN_INVITAR = ['Administrador del Sistema', 'Superadministrador']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Falta el encabezado de autorización' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const clienteLlamante = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: sesion, error: errorSesion } = await clienteLlamante.auth.getUser()
  if (errorSesion || !sesion.user) return json({ error: 'Sesión inválida o expirada' }, 401)

  const clienteAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { data: perfilLlamante } = await clienteAdmin.from('profiles').select('rol, activo').eq('id', sesion.user.id).maybeSingle()
  if (!perfilLlamante || !perfilLlamante.activo || !ROLES_QUE_PUEDEN_INVITAR.includes(perfilLlamante.rol)) {
    return json({ error: 'No tienes permiso para invitar usuarios' }, 403)
  }

  let cuerpo: { email?: string; nombre?: string; rol?: string }
  try {
    cuerpo = await req.json()
  } catch {
    return json({ error: 'Cuerpo de la solicitud inválido' }, 400)
  }
  const { email, nombre, rol } = cuerpo
  if (!email || !nombre || !rol) return json({ error: 'Faltan datos: correo, nombre y rol son obligatorios' }, 400)
  // Fase 7a (Subfase 4/4): los roles son un catálogo en la tabla `roles`, no una lista fija
  // -- se valida contra la base en vez de un arreglo hardcodeado, para que un rol creado
  // desde /admin/roles funcione aquí también sin redesplegar la función.
  const { data: rolExiste } = await clienteAdmin.from('roles').select('nombre').eq('nombre', rol).maybeSingle()
  if (!rolExiste) return json({ error: 'Rol inválido' }, 400)

  const { data: invitado, error: errorInvitar } = await clienteAdmin.auth.admin.inviteUserByEmail(email, { data: { nombre } })
  if (errorInvitar || !invitado.user) {
    return json({ error: errorInvitar?.message ?? 'No se pudo enviar la invitación' }, 400)
  }

  // El trigger handle_new_user() (0003_auth_trigger.sql) ya creó la fila en profiles con
  // el nombre correcto (viene de raw_user_meta_data) y rol por defecto 'Property Manager';
  // aquí solo se ajusta al rol elegido por quien invita.
  await clienteAdmin.from('profiles').update({ rol }).eq('id', invitado.user.id)

  await clienteAdmin.from('bitacora').insert({
    entidad: 'profiles',
    entidad_id: invitado.user.id,
    tipo_evento: 'alta_usuario',
    usuario_id: sesion.user.id,
    descripcion: `Invitación enviada a ${email} (${nombre}) con rol ${rol}`,
  })

  return json({ ok: true, userId: invitado.user.id })
})
