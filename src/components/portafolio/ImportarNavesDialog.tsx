import { useRef, useState } from 'react'
import { CheckCircle2, Download, FileUp, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDataStore } from '@/context/DataStoreContext'
import { parques } from '@/data'
import { descargarPlantillaNaves, leerFilasDeArchivo, parsearFilasNaves, type FilaImportada } from '@/lib/importarNaves'

export function ImportarNavesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { naves, agregarNave } = useDataStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [filas, setFilas] = useState<FilaImportada[] | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [importando, setImportando] = useState(false)
  const [importado, setImportado] = useState<number | null>(null)

  const validas = filas?.filter((f) => f.nave !== null) ?? []
  const invalidas = filas?.filter((f) => f.nave === null) ?? []

  function reiniciar() {
    setNombreArchivo(null)
    setFilas(null)
    setErrorArchivo(null)
    setImportando(false)
    setImportado(null)
  }

  function alAbrir(abierto: boolean) {
    if (!abierto) reiniciar()
    onOpenChange(abierto)
  }

  async function alSeleccionarArchivo(archivo: File) {
    setNombreArchivo(archivo.name)
    setErrorArchivo(null)
    setFilas(null)
    setLeyendo(true)
    try {
      const filasCrudas = await leerFilasDeArchivo(archivo)
      if (filasCrudas.length === 0) {
        setErrorArchivo('El archivo no tiene filas de datos.')
        return
      }
      setFilas(parsearFilasNaves(filasCrudas, { parques, navesExistentes: naves }))
    } catch {
      setErrorArchivo('No se pudo leer el archivo. Verifica que sea un .xlsx, .xls o .csv válido.')
    } finally {
      setLeyendo(false)
    }
  }

  function confirmarImportacion() {
    setImportando(true)
    for (const fila of validas) {
      if (fila.nave) agregarNave(fila.nave)
    }
    setImportado(validas.length)
    setImportando(false)
  }

  return (
    <Dialog open={open} onOpenChange={alAbrir}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Naves desde Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo con la misma estructura de columnas que la plantilla. Cada fila válida se da de alta como un
            inmueble nuevo del portafolio.
          </DialogDescription>
        </DialogHeader>

        {importado !== null ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success-bg text-status-success">✓</div>
            <p className="text-sm font-medium text-foreground">
              {importado} {importado === 1 ? 'nave agregada' : 'naves agregadas'} al Directorio del Portafolio.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const archivo = e.target.files?.[0]
                  if (archivo) void alSeleccionarArchivo(archivo)
                  e.target.value = ''
                }}
              />
              <Button size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={leyendo}>
                <FileUp className="h-3.5 w-3.5" />
                {leyendo ? 'Leyendo…' : 'Seleccionar Archivo'}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void descargarPlantillaNaves()}>
                <Download className="h-3.5 w-3.5" />
                Descargar Plantilla
              </Button>
              {nombreArchivo && <span className="text-xs text-muted-foreground">{nombreArchivo}</span>}
            </div>

            {errorArchivo && <p className="text-xs text-status-danger">{errorArchivo}</p>}

            {filas && (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 font-medium text-status-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {validas.length} listas para importar
                  </span>
                  {invalidas.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-medium text-status-danger">
                      <XCircle className="h-3.5 w-3.5" /> {invalidas.length} con errores (no se importarán)
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Fila</TableHead>
                        <TableHead>Folio</TableHead>
                        <TableHead>Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filas.map((f) => (
                        <TableRow key={f.numeroFila}>
                          <TableCell className="tabular text-xs text-muted-foreground">{f.numeroFila}</TableCell>
                          <TableCell className="text-xs font-medium text-foreground">{f.folio || '—'}</TableCell>
                          <TableCell className="text-xs">
                            {f.nave ? (
                              <span className="text-status-success">Válida</span>
                            ) : (
                              <span className="text-status-danger">{f.errores.join('; ')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {importado !== null ? (
            <Button onClick={() => alAbrir(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => alAbrir(false)}>
                Cancelar
              </Button>
              <Button disabled={validas.length === 0 || importando} onClick={confirmarImportacion}>
                {importando ? 'Importando…' : `Importar ${validas.length} ${validas.length === 1 ? 'Nave' : 'Naves'}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
