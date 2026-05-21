import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, Minus } from 'lucide-react'

export default function FormularioCotizacion({ abierto, onCerrar, onCreada }) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    nombre_paciente: '',
    numero_telefono: '',
    sede: 'principal',
    validez_dias: '15',
    notas: '',
    estado: 'borrador',
  })
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [servicioSeleccionado, setServicioSeleccionado] = useState('')
  const [cantidadServicio, setCantidadServicio] = useState(1)
  const [itemsAgregados, setItemsAgregados] = useState([])

  // Resetear al abrir
  useEffect(() => {
    if (abierto) {
      setForm({ nombre_paciente: '', numero_telefono: '', sede: 'principal', validez_dias: '15', notas: '', estado: 'borrador' })
      setItemsAgregados([])
      setCategoriaSeleccionada('')
      setServicioSeleccionado('')
      setCantidadServicio(1)
    }
  }, [abierto])

  // Cargar catálogo según sede
  const { data: catalogo = [] } = useQuery({
    queryKey: ['catalogo', form.sede],
    queryFn: () => api.catalogo.listar({ sede: form.sede, activo: '1' }),
    enabled: abierto,
  })

  // Categorías únicas
  const categorias = [...new Set(catalogo.map(s => s.categoria))].sort()

  // Servicios filtrados por categoría
  const serviciosFiltrados = categoriaSeleccionada
    ? catalogo.filter(s => s.categoria === categoriaSeleccionada)
    : []

  const servicioObj = catalogo.find(s => String(s.id) === String(servicioSeleccionado))

  const agregarServicio = () => {
    if (!servicioObj) return
    // Si ya existe, actualizar cantidad
    const existente = itemsAgregados.find(i => i.servicio_id === servicioObj.id)
    if (existente) {
      setItemsAgregados(prev => prev.map(i =>
        i.servicio_id === servicioObj.id
          ? { ...i, cantidad: i.cantidad + cantidadServicio, subtotal: servicioObj.precio * (i.cantidad + cantidadServicio) }
          : i
      ))
    } else {
      setItemsAgregados(prev => [...prev, {
        servicio_id: servicioObj.id,
        nombre: servicioObj.nombre,
        categoria: servicioObj.categoria,
        precio_unitario: servicioObj.precio,
        cantidad: cantidadServicio,
        subtotal: servicioObj.precio * cantidadServicio,
      }])
    }
    setServicioSeleccionado('')
    setCantidadServicio(1)
  }

  const eliminarItem = (servicioId) => {
    setItemsAgregados(prev => prev.filter(i => i.servicio_id !== servicioId))
  }

  const cambiarCantidad = (servicioId, delta) => {
    setItemsAgregados(prev => prev.map(i => {
      if (i.servicio_id !== servicioId) return i
      const nueva = Math.max(1, i.cantidad + delta)
      return { ...i, cantidad: nueva, subtotal: i.precio_unitario * nueva }
    }))
  }

  const total = itemsAgregados.reduce((acc, i) => acc + i.subtotal, 0)

  const mutacion = useMutation({
    mutationFn: (datos) => api.cotizaciones.crear(datos),
    onSuccess: (cotizacion) => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast({ title: `Cotización ${cotizacion.numero_cotizacion} creada` })
      onCreada?.(cotizacion)
      onCerrar()
    },
    onError: (err) => toast({ title: 'Error al crear', description: err.message, variant: 'destructive' }),
  })

  const guardar = () => {
    if (!form.nombre_paciente.trim()) return toast({ title: 'Falta el nombre del paciente', variant: 'destructive' })
    if (!form.numero_telefono.trim()) return toast({ title: 'Falta el número de teléfono', variant: 'destructive' })
    if (itemsAgregados.length === 0) return toast({ title: 'Agregá al menos un servicio', variant: 'destructive' })

    mutacion.mutate({
      ...form,
      validez_dias: form.validez_dias === 'sin_fecha' ? null : parseInt(form.validez_dias),
      servicios: itemsAgregados.map(i => ({ servicio_id: i.servicio_id, cantidad: i.cantidad })),
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cotización</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Datos paciente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre del paciente *</Label>
              <Input
                placeholder="Juan García"
                value={form.nombre_paciente}
                onChange={e => setForm(f => ({ ...f, nombre_paciente: e.target.value }))}
              />
            </div>
            <div>
              <Label>Teléfono *</Label>
              <Input
                type="tel"
                placeholder="+54 11 1234-5678"
                value={form.numero_telefono}
                onChange={e => setForm(f => ({ ...f, numero_telefono: e.target.value }))}
              />
            </div>
          </div>

          {/* Sede y validez */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Sede *</Label>
              <Select value={form.sede} onValueChange={v => setForm(f => ({ ...f, sede: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Sede Principal</SelectItem>
                  <SelectItem value="secundaria">Sede Secundaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Validez</Label>
              <Select value={form.validez_dias} onValueChange={v => setForm(f => ({ ...f, validez_dias: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="sin_fecha">Sin fecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado inicial</Label>
              <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agregar servicios */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Agregar servicios</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Categoría</Label>
                <Select value={categoriaSeleccionada} onValueChange={v => { setCategoriaSeleccionada(v); setServicioSeleccionado('') }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Servicio</Label>
                <Select
                  value={servicioSeleccionado}
                  onValueChange={setServicioSeleccionado}
                  disabled={!categoriaSeleccionada}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviciosFiltrados.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombre} — ${s.precio.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cantidad</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="1"
                    value={cantidadServicio}
                    onChange={e => setCantidadServicio(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={agregarServicio}
                    disabled={!servicioSeleccionado}
                    className="bg-[#063740] hover:bg-[#063740]/90 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Items agregados */}
            {itemsAgregados.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {itemsAgregados.map(item => (
                  <div key={item.servicio_id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{item.nombre}</span>
                      <span className="text-gray-400 text-xs ml-2">${item.precio_unitario.toFixed(2)} c/u</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <button onClick={() => cambiarCantidad(item.servicio_id, -1)} className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-medium">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.servicio_id, 1)} className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="w-16 text-right font-medium text-[#063740]">${item.subtotal.toFixed(2)}</span>
                      <button onClick={() => eliminarItem(item.servicio_id)} className="text-red-400 hover:text-red-600 ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex justify-end pt-2 border-t">
                  <span className="font-bold text-[#a8781a] text-base">Total: ${total.toFixed(2)} USD</span>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <Label>Observaciones (opcional)</Label>
            <Textarea
              placeholder="Notas adicionales para el paciente..."
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onCerrar}>Cancelar</Button>
          <Button
            onClick={guardar}
            disabled={mutacion.isPending}
            className="bg-[#063740] hover:bg-[#063740]/90"
          >
            {mutacion.isPending ? 'Guardando...' : 'Guardar Cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
