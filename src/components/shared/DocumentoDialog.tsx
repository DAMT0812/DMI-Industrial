import { useEffect, useRef, useState } from 'react'
import { FileUp, FileText, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatFecha } from '@/lib/dates'
import type { EstatusDocumental } from '@/data'

const ESTATUS_DOCUMENTALES: EstatusDocumental[] = [
  'Pendiente de envío / por vencer',
  'En revisión / pendiente de aprobación',
  'Aprobado / al día',
  'Rechazado / requiere corrección',
  'En mora / fuera de plazo',
]

interface CambiosDocumento {
  numeroFolio: string
  dependenciaEmisora: string
  fechaEmision: string
  fechaVencimiento: string | null
  estatus: EstatusDocumental
}

interface DocumentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  dependenciaEmisora?: string
  numeroFolio?: string
  fechaEmision?: string
  fechaVencimiento?: string | null
  estatus?: string
  archivoActual: File | null
  onArchivoCambiado: (file: File) => void
  // Cuando se provee, habilita el modo edición de la ficha (folio, dependencia
  // emisora, fechas y estatus jurídico). Se omite para vistas de solo lectura
  // (p. ej. estudios técnicos) que aún no tienen una edición modelada.
  onGuardarCambios?: (cambios: CambiosDocumento) => void
}

export function DocumentoDialog({
  open,
  onOpenChange,
  titulo,
  dependenciaEmisora,
  numeroFolio,
  fechaEmision,
  fechaVencimiento,
  estatus,
  archivoActual,
  onArchivoCambiado,
  onGuardarCambios,
}: DocumentoDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [edicion, setEdicion] = useState<CambiosDocumento | null>(null)

  useEffect(() => {
    if (!archivoActual) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(archivoActual)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [archivoActual])

  useEffect(() => {
    if (open) setModoEdicion(false)
  }, [open, numeroFolio])

  function iniciarEdicion() {
    setEdicion({
      numeroFolio: numeroFolio ?? '',
      dependenciaEmisora: dependenciaEmisora ?? '',
      fechaEmision: fechaEmision ?? '',
      fechaVencimiento: fechaVencimiento ?? '',
      estatus: (estatus as EstatusDocumental) ?? 'Pendiente de envío / por vencer',
    })
    setModoEdicion(true)
  }

  function guardarEdicion() {
    if (!edicion || !onGuardarCambios) return
    onGuardarCambios({
      ...edicion,
      numeroFolio: edicion.numeroFolio.trim(),
      dependenciaEmisora: edicion.dependenciaEmisora.trim(),
      fechaVencimiento: edicion.fechaVencimiento || null,
    })
    setModoEdicion(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {dependenciaEmisora && <DialogDescription>{dependenciaEmisora}</DialogDescription>}
        </DialogHeader>

        {previewUrl && archivoActual ? (
          archivoActual.type === 'application/pdf' ? (
            <iframe src={previewUrl} title={titulo} className="h-72 w-full rounded-md border border-border" />
          ) : archivoActual.type.startsWith('image/') ? (
            <img src={previewUrl} alt={titulo} className="max-h-72 w-full rounded-md border border-border object-contain" />
          ) : (
            <div className="rounded-md border border-border bg-surface-secondary p-4 text-sm text-muted-foreground">
              Archivo cargado: {archivoActual.name} ({Math.round(archivoActual.size / 1024)} KB) — sin vista previa para este formato.
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-surface-secondary p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No hay un archivo cargado en esta sesión — se muestra la ficha del documento. Carga un PDF o imagen para previsualizarlo aquí.
            </p>
          </div>
        )}

        {modoEdicion && edicion ? (
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Folio</label>
                <Input value={edicion.numeroFolio} onChange={(e) => setEdicion({ ...edicion, numeroFolio: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Estatus Jurídico</label>
                <select
                  value={edicion.estatus}
                  onChange={(e) => setEdicion({ ...edicion, estatus: e.target.value as EstatusDocumental })}
                  className="h-8 w-full rounded-md border border-border bg-surface-secondary px-2 text-xs focus:border-brand-cobalt focus:outline-none"
                >
                  {ESTATUS_DOCUMENTALES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Dependencia Emisora</label>
                <Input
                  value={edicion.dependenciaEmisora}
                  onChange={(e) => setEdicion({ ...edicion, dependenciaEmisora: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Fecha de Emisión</label>
                <Input
                  type="date"
                  value={edicion.fechaEmision}
                  onChange={(e) => setEdicion({ ...edicion, fechaEmision: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Fecha de Vencimiento</label>
                <Input
                  type="date"
                  value={edicion.fechaVencimiento ?? ''}
                  onChange={(e) => setEdicion({ ...edicion, fechaVencimiento: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setModoEdicion(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={guardarEdicion}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {onGuardarCambios && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="h-6 gap-1 text-[11px]" onClick={iniciarEdicion}>
                  <Pencil className="h-3 w-3" />
                  Editar Ficha
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {numeroFolio && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Folio</span>
                  <span className="tabular text-foreground">{numeroFolio}</span>
                </div>
              )}
              {estatus && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Estatus</span>
                  <StatusBadge estatus={estatus} />
                </div>
              )}
              {fechaEmision && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Emisión</span>
                  <span className="tabular text-foreground">{formatFecha(fechaEmision)}</span>
                </div>
              )}
              {fechaVencimiento && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Vencimiento</span>
                  <span className="tabular text-foreground">{formatFecha(fechaVencimiento)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onArchivoCambiado(file)
            e.target.value = ''
          }}
        />
        <DialogFooter>
          <Button variant="outline" className="gap-1.5" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            {archivoActual ? 'Reemplazar Archivo' : 'Cargar Archivo'}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
