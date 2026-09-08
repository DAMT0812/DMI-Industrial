import { cn } from '@/lib/utils'

type Tono = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

// Mapea cada valor de estatus usado en el catálogo de datos a un tono visual.
// Centralizado aquí para que el mismo estatus siempre se vea igual en toda la app.
const TONO_POR_ESTATUS: Record<string, Tono> = {
  // Operativo de nave
  'Óptimo Operativo': 'success',
  'Alerta Predial Pendiente': 'warning',
  'En Renovación Formal': 'info',
  'Mant. Preventivo HVAC': 'warning',
  'En Mora': 'danger',
  // General
  Pendiente: 'neutral',
  'En Revisión': 'info',
  Aprobado: 'success',
  Rechazado: 'danger',
  Vigente: 'success',
  // Tickets / prioridad
  Crítica: 'danger',
  Alta: 'danger',
  Media: 'warning',
  Baja: 'neutral',
  Abierta: 'warning',
  'En Proceso': 'info',
  'Esperando Refacción': 'warning',
  Cerrada: 'success',
  // Salud de sistemas
  Óptimo: 'success',
  Alerta: 'warning',
  'Crítico': 'danger',
  // Comité CapEx
  'En Revisión Comité': 'info',
  'Aprobado x Dirección': 'success',
  'Pendiente 3ra Cotización': 'warning',
  'En Ejecución': 'info',
  Concluido: 'success',
  // Urgencia de alertas
  'Crítico Inminente': 'danger',
  'Garantía Legal': 'warning',
  'En Cumplimiento': 'success',
  // Contratos
  'Triple Net (NNN)': 'info',
  // Pólizas / certificaciones
  'Por Vencer': 'warning',
  Vencida: 'danger',
}

const CLASES_TONO: Record<Tono, { texto: string; punto: string }> = {
  success: { texto: 'bg-status-success-bg text-status-success', punto: 'bg-status-success' },
  warning: { texto: 'bg-status-warning-bg text-status-warning', punto: 'bg-status-warning' },
  danger: { texto: 'bg-status-danger-bg text-status-danger', punto: 'bg-status-danger' },
  neutral: { texto: 'bg-status-neutral-bg text-status-neutral', punto: 'bg-status-neutral' },
  info: { texto: 'bg-brand-cobalt/10 text-brand-cobalt', punto: 'bg-brand-cobalt' },
}

export function StatusBadge({ estatus, tono, className }: { estatus: string; tono?: Tono; className?: string }) {
  const t = tono ?? TONO_POR_ESTATUS[estatus] ?? 'neutral'
  const clases = CLASES_TONO[t]
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-sm px-2 text-xs font-medium whitespace-nowrap',
        clases.texto,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', clases.punto)} />
      {estatus}
    </span>
  )
}
