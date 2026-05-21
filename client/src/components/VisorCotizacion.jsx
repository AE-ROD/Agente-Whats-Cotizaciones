import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, MessageCircle, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

const ESTADOS_COLORES = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-yellow-100 text-yellow-700',
  aceptada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function VisorCotizacion({ cotizacionId, abierto, onCerrar }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => api.cotizaciones.obtener(cotizacionId),
    enabled: !!cotizacionId && abierto,
  })

  const mutacion = useMutation({
    mutationFn: (estado) => api.cotizaciones.actualizarEstado(cotizacionId, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizacion', cotizacionId] })
      toast({ title: 'Estado actualizado' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const abrirPDF = () => {
    const url = api.cotizaciones.urlHtml(cotizacionId)
    const ventana = window.open(url, '_blank')
    if (ventana) {
      ventana.addEventListener('load', () => setTimeout(() => ventana.print(), 500))
    }
  }

  const abrirWhatsApp = () => {
    if (!data) return
    const numero = data.numero_telefono.replace(/\D/g, '')
    const texto = encodeURIComponent(
      `Hola ${data.nombre_paciente}, te enviamos la cotización N° ${data.numero_cotizacion} por $${Number(data.total).toFixed(2)} USD.`
    )
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
  }

  const cotizacion = data
  const items = data?.items || []

  // Agrupar ítems por categoría
  const itemsPorCategoria = {}
  for (const item of items) {
    if (!itemsPorCategoria[item.categoria]) itemsPorCategoria[item.categoria] = []
    itemsPorCategoria[item.categoria].push(item)
  }

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-2 border-[#063740] border-t-transparent rounded-full" />
          </div>
        ) : cotizacion ? (
          <div>
            {/* Header del documento */}
            <div className="bg-[#063740] text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">Clínica Dental Sonrisa</h2>
                  <p className="text-teal-200 text-sm mt-0.5">Odontología de confianza</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-teal-200 uppercase tracking-wider">Cotización N°</p>
                  <p className="text-lg font-bold">{cotizacion.numero_cotizacion}</p>
                </div>
              </div>
              <div className="border-t border-[#a8781a] mt-4 pt-3 flex gap-6 text-sm text-teal-200">
                <span>📅 {formatearFecha(cotizacion.creado_en)}</span>
                <span>📍 {cotizacion.sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria'}</span>
                {cotizacion.validez_dias && <span>⏱ {cotizacion.validez_dias} días de validez</span>}
              </div>
            </div>

            {/* Datos paciente */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Paciente</p>
                <p className="font-semibold">{cotizacion.nombre_paciente}</p>
                <p className="text-sm text-gray-500">{cotizacion.numero_telefono}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Estado</p>
                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${ESTADOS_COLORES[cotizacion.estado]}`}>
                  {cotizacion.estado}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total</p>
                <p className="text-xl font-bold text-[#a8781a]">${Number(cotizacion.total).toFixed(2)} USD</p>
              </div>
            </div>

            {/* Tabla de servicios */}
            <div className="p-6">
              <h3 className="text-xs font-bold text-[#063740] uppercase tracking-wider mb-3">Servicios incluidos</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#063740] text-white">
                    <th className="text-left px-3 py-2 rounded-tl text-xs">Servicio</th>
                    <th className="text-center px-3 py-2 text-xs">Cant.</th>
                    <th className="text-right px-3 py-2 text-xs">P. Unit.</th>
                    <th className="text-right px-3 py-2 rounded-tr text-xs">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(itemsPorCategoria).map(([cat, servicios]) => (
                    <>
                      <tr key={`cat-${cat}`} className="bg-gray-100">
                        <td colSpan={4} className="px-3 py-1.5 text-xs font-bold text-[#063740] uppercase tracking-wider">
                          {cat}
                        </td>
                      </tr>
                      {servicios.map((item, i) => (
                        <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">{item.nombre_servicio}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right text-gray-600">${Number(item.precio_unitario).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium">${Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                  {/* Total */}
                  <tr className="bg-amber-50 border-t-2 border-[#a8781a]">
                    <td colSpan={3} className="px-3 py-3 text-right font-bold text-gray-700">TOTAL USD</td>
                    <td className="px-3 py-3 text-right font-bold text-[#a8781a] text-lg">
                      ${Number(cotizacion.total).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {cotizacion.notas && (
                <div className="mt-4 p-3 bg-amber-50 border-l-4 border-[#a8781a] rounded">
                  <p className="text-xs font-bold text-[#a8781a] mb-1">OBSERVACIONES</p>
                  <p className="text-sm text-gray-600">{cotizacion.notas}</p>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
                Cotización referencial, sujeta a evaluación clínica. Valores en USD.
                {cotizacion.validez_dias && ` Válida por ${cotizacion.validez_dias} días.`}
              </div>
            </div>

            {/* Barra de acciones */}
            <div className="border-t p-4 flex flex-wrap items-center gap-3 bg-gray-50">
              <Select value={cotizacion.estado} onValueChange={(e) => mutacion.mutate(e)}>
                <SelectTrigger className="w-36 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="aceptada">Aceptada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={abrirWhatsApp}>
                <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp
              </Button>

              <Button variant="outline" size="sm" onClick={abrirPDF}>
                <Printer className="w-4 h-4 mr-1.5" /> Imprimir / PDF
              </Button>

              <Button variant="ghost" size="sm" onClick={onCerrar} className="ml-auto">
                <X className="w-4 h-4 mr-1.5" /> Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">No se encontró la cotización</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
