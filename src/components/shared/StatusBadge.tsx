import { cn } from '@/lib/utils'

type Tono = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'mantenimiento' | 'contrato' | 'capex' | 'critico'

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
  'Terminación Programada': 'warning',
  // Cumplimiento documental
  'Pendiente de envío / por vencer': 'warning',
  'En revisión / pendiente de aprobación': 'info',
  'Aprobado / al día': 'success',
  'Rechazado / requiere corrección': 'danger',
  'En mora / fuera de plazo': 'danger',
  // Tickets / prioridad
  Crítica: 'danger',
  Alta: 'danger',
  Media: 'warning',
  Baja: 'neutral',
  Abierta: 'warning',
  'En ejecución': 'info',
  'Esperando Refacción': 'warning',
  'Pendiente de Evidencia': 'warning',
  Validado: 'success',
  Cancelada: 'neutral',
  Cancelado: 'neutral',
  // Salud de sistemas
  Óptimo: 'success',
  Alerta: 'warning',
  'Crítico': 'danger',
  // Comité CapEx
  'En Revisión Comité': 'info',
  'Aprobado por Dirección': 'capex',
  'Pendiente 3ra Cotización': 'warning',
  'En Ejecución': 'info',
  Concluido: 'capex',
  // Urgencia de alertas
  'Crítico Inminente': 'critico',
  'Garantía Legal': 'warning',
  'En Cumplimiento': 'success',
  // Contratos
  'Triple Net (NNN)': 'contrato',
  'Doble Neto (NN)': 'contrato',
  'Bruto Modificado': 'contrato',
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
  // Acentos de categoría — Industrial Property Core
  mantenimiento: { texto: 'bg-badge-mant-bg text-badge-mant-text', punto: 'bg-badge-mant-dot' },
  contrato: { texto: 'bg-badge-contrato-bg text-badge-contrato-text', punto: 'bg-badge-contrato-dot' },
  capex: { texto: 'bg-badge-capex-bg text-badge-capex-text', punto: 'bg-badge-capex-dot' },
  critico: { texto: 'bg-badge-critico-bg text-badge-critico-text', punto: 'bg-badge-critico-dot' },
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
