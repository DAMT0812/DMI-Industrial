import { Building2, FileDown, Images, PlayCircle, Warehouse } from 'lucide-react'
import type { Nave } from '@/data'

const GALERIA = [
  { etiqueta: 'Fachada Exterior', icono: Building2 },
  { etiqueta: 'Interior — Nave de Producción', icono: Warehouse },
  { etiqueta: 'Cubierta y Sistema Pluvial', icono: Images },
  { etiqueta: 'Andenes y Patio de Maniobras', icono: Warehouse },
]

const PLANOS_TECNICOS = [
  { nombre: 'Plano de Conjunto General', formato: 'PDF' },
  { nombre: 'Instalación Eléctrica y Subestación', formato: 'DWG' },
  { nombre: 'Red Hidrosanitaria', formato: 'DWG' },
  { nombre: 'Detalles de Andenes y Rampas', formato: 'PDF' },
  { nombre: 'Modelo BIM Coordinado', formato: 'BIM' },
  { nombre: 'As-Built Estructural', formato: 'DWG' },
]

export function MultimediaTab({ nave: _nave }: { nave: Nave }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Galería Fotográfica HD</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {GALERIA.map((g) => (
            <div key={g.etiqueta} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-surface-secondary to-border text-muted-foreground">
                <g.icono className="h-8 w-8" />
              </div>
              <div className="p-2.5 text-xs font-medium text-foreground">{g.etiqueta}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Recorrido Virtual 360°</div>
            <p className="text-xs text-muted-foreground">Tour interactivo de la nave — interior, cubierta y patio de maniobras.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Repositorio de Planos Técnicos</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLANOS_TECNICOS.map((p) => (
            <div key={p.nombre} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-pine/10 text-brand-pine">
                <FileDown className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{p.nombre}</div>
                <div className="text-[11px] font-semibold text-muted-foreground">{p.formato}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
