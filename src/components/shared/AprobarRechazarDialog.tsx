import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface AprobarRechazarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion?: string
  etiquetaAprobar?: string
  etiquetaRechazar?: string
  onAprobar: () => void
  onRechazar: (motivo: string) => void
}

// Patrón de interacción ligera de la maqueta: cambia el estado visualmente
// en la sesión del navegador, sin persistir nada — el mismo principio ya
// usado en la votación de CapEx, ahora reutilizable para OT y renovaciones.
export function AprobarRechazarDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  etiquetaAprobar = 'Aprobar',
  etiquetaRechazar = 'Rechazar',
  onAprobar,
  onRechazar,
}: AprobarRechazarDialogProps) {
  const [modo, setModo] = useState<'inicio' | 'rechazo'>('inicio')
  const [motivo, setMotivo] = useState('')

  function cerrar(open: boolean) {
    if (!open) {
      setModo('inicio')
      setMotivo('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>

        {modo === 'inicio' ? (
          <p className="text-sm text-muted-foreground">
            Revisa la evidencia/información antes de decidir. Un rechazo requiere registrar el motivo.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Motivo del rechazo (obligatorio)</label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Evidencia insuficiente, folio no corresponde, falta corregir alcance…"
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          {modo === 'inicio' ? (
            <>
              <Button
                variant="outline"
                className="gap-1.5 text-status-danger hover:text-status-danger"
                onClick={() => setModo('rechazo')}
              >
                <XCircle className="h-4 w-4" />
                {etiquetaRechazar}
              </Button>
              <Button
                className="gap-1.5"
                onClick={() => {
                  onAprobar()
                  cerrar(false)
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {etiquetaAprobar}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setModo('inicio')}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={motivo.trim().length === 0}
                onClick={() => {
                  onRechazar(motivo.trim())
                  cerrar(false)
                }}
              >
                Confirmar Rechazo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
