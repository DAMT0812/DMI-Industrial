import { cn } from '@/lib/utils'

// Monograma "DMI" recortado del isotipo oficial de Grupo DMI, recoloreado a blanco
// y con fondo transparente — para usarse sobre superficies oscuras (sidebar, login).
export function LogoMark({ className }: { className?: string }) {
  return <img src="/logo-mark-white.png" alt="" className={cn('object-contain', className)} />
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 p-1.5">
        <LogoMark className="h-full w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <img src="/logo-dmi-white.png" alt="Grupo DMI" className="h-8 w-auto object-contain" />
      <div className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-slate-400">
        Industrial · Asset Management
      </div>
    </div>
  )
}
