import { cn } from '@/lib/utils'

interface PillOption<T extends string> {
  value: T
  label: string
}

export function PillToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly PillOption<T>[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-full border border-border bg-surface-secondary p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'h-7 rounded-full px-3 text-xs font-semibold tabular transition-colors',
            value === opt.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
