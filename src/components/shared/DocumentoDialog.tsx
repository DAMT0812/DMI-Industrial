import { useEffect, useRef, useState } from 'react'
import { Download, FileUp, FileText, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { supabase } from '@/lib/supabaseClient'
import { formatFecha } from '@/lib/dates'
import type { EstatusDocumental } from '@/data'

const ESTATUS_DOCUMENTALES: EstatusDocumental[] = ['Pendiente', 'En Revisión', 'Aprobado/Vigente', 'Rechazado', 'Aprobado por Excepción', 'En Mora']

const BUCKET = 'documentos'

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
  // Cuando se proveen documentoId + archivoPath, el archivo se guarda de verdad en
  // Supabase Storage (bucket privado, con versionado) en vez de solo mantenerse en
  // memoria de la sesión — usado para documentos del expediente, no para estudios
  // técnicos (que siguen en modo "solo esta sesión").
  documentoId?: string
  archivoPath?: string | null
  onArchivoSubido?: (path: string) => void
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
  documentoId,
  archivoPath,
  onArchivoSubido,
}: DocumentoDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [edicion, setEdicion] = useState<CambiosDocumento | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)

  const usaStorageReal = Boolean(documentoId)

  // Modo local (estudios técnicos, sin persistencia real): preview desde el File en memoria.
  useEffect(() => {
    if (usaStorageReal) return
    if (!archivoActual) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(archivoActual)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [archivoActual, usaStorageReal])

  // Modo Storage real: pide una URL firmada (5 min de vigencia) del archivo ya guardado.
  useEffect(() => {
    if (!usaStorageReal) return
    if (!open || !archivoPath) {
      setPreviewUrl(null)
      return
    }
    let cancelado = false
    supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(archivoPath, 300)
      .then(({ data }) => {
        if (!cancelado && data) setPreviewUrl(data.signedUrl)
      })
    return () => {
      cancelado = true
    }
  }, [usaStorageReal, open, archivoPath])

  useEffect(() => {
    if (open) {
      setModoEdicion(false)
      setErrorArchivo(null)
    }
  }, [open, numeroFolio])

  function iniciarEdicion() {
    setEdicion({
      numeroFolio: numeroFolio ?? '',
      dependenciaEmisora: dependenciaEmisora ?? '',
      fechaEmision: fechaEmision ?? '',
      fechaVencimiento: fechaVencimiento ?? '',
      estatus: (estatus as EstatusDocumental) ?? 'Pendiente',
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

  async function manejarArchivoElegido(file: File) {
    if (!usaStorageReal || !documentoId) {
      onArchivoCambiado(file)
      return
    }
    setSubiendo(true)
    setErrorArchivo(null)
    try {
      const rutaNueva = `${documentoId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
      const { error: errorSubida } = await supabase.storage.from(BUCKET).upload(rutaNueva, file)
      if (errorSubida) throw errorSubida

      if (archivoPath) {
        await supabase.from('documento_versiones').insert({ documento_id: documentoId, version: Date.now(), archivo_path: archivoPath })
      }

      onArchivoSubido?.(rutaNueva)
    } catch (err) {
      setErrorArchivo(err instanceof Error ? err.message : 'No se pudo subir el archivo.')
    } finally {
      setSubiendo(false)
    }
  }

  async function descargar() {
    if (!usaStorageReal || !archivoPath) return
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(archivoPath, 300, { download: true })
    if (data) window.open(data.signedUrl, '_blank')
  }

  const hayArchivo = usaStorageReal ? Boolean(archivoPath) : Boolean(archivoActual)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {dependenciaEmisora && <DialogDescription>{dependenciaEmisora}</DialogDescription>}
        </DialogHeader>

        {previewUrl && hayArchivo ? (
          !usaStorageReal && archivoActual?.type.startsWith('image/') ? (
            <img src={previewUrl} alt={titulo} className="max-h-72 w-full rounded-md border border-border object-contain" />
          ) : (
            <iframe src={previewUrl} title={titulo} className="h-72 w-full rounded-md border border-border" />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-surface-secondary p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {usaStorageReal
                ? 'Este documento todavía no tiene un archivo cargado. Sube un PDF o imagen.'
                : 'No hay un archivo cargado en esta sesión — se muestra la ficha del documento. Carga un PDF o imagen para previsualizarlo aquí.'}
            </p>
          </div>
        )}

        {errorArchivo && <p className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger">{errorArchivo}</p>}

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
            if (file) void manejarArchivoElegido(file)
            e.target.value = ''
          }}
        />
        <DialogFooter>
          {usaStorageReal && hayArchivo && (
            <Button variant="outline" className="gap-1.5" onClick={() => void descargar()}>
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          )}
          <Button variant="outline" className="gap-1.5" disabled={subiendo} onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4" />
            {subiendo ? 'Subiendo…' : hayArchivo ? 'Reemplazar Archivo' : 'Cargar Archivo'}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
