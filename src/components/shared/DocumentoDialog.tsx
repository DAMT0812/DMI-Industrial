import { useEffect, useRef, useState } from 'react'
import { FileUp, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatFecha } from '@/lib/dates'

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
}

// Visor + cargador de documentos real dentro de las restricciones de la maqueta:
// si el usuario carga un PDF/imagen en la sesión, se previsualiza de verdad
// (URL.createObjectURL, sin subir a ningún lado); si no, se muestra la ficha
// de metadatos del documento como vista previa de respaldo.
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
}: DocumentoDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!archivoActual) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(archivoActual)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [archivoActual])

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
