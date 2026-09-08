// Wordmark placeholder de Grupo DMI (sin logo oficial disponible en el proyecto).
// Monograma "M" estilizado: los trazos centrales no tocan el borde superior,
// dejando un espacio negativo triangular — ver prompt de diseño de marca.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 28" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 25 L3 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M31 25 L31 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M3 11 L17 22 L31 11" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
        <LogoMark className="h-4 w-4 text-white" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10">
          <LogoMark className="h-4 w-4 text-white" />
        </div>
        <div className="leading-none">
          <div className="text-[10px] font-light uppercase tracking-[0.28em] text-slate-300">Grupo</div>
          <div className="text-lg font-extrabold uppercase tracking-tight text-white">DMI</div>
        </div>
      </div>
      <div className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-slate-400">
        Industrial · Asset Management
      </div>
    </div>
  )
}
