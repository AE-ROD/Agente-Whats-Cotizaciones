import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { FileText, Plus, Eye, MessageCircle, Printer, Bot, Search, DollarSign, Trash2, User } from 'lucide-react'
import VisorCotizacion from './VisorCotizacion'
import FormularioCotizacion from './FormularioCotizacion'

const ESTADOS_CONFIG = {
  borrador:  { label: 'Borrador',  className: 'bg-gray-100   text-gray-700   border-gray-200'  },
  enviada:   { label: 'Enviada',   className: 'bg-amber-100  text-amber-700  border-amber-200' },
  aceptada:  { label: 'Aceptada', className: 'bg-green-100  text-green-700  border-green-200' },
  rechazada: { label: 'Rechazada',className: 'bg-red-100    text-red-700    border-red-200'   },
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TabCotizaciones() {
  const [filtroSede,    setFiltroSede]    = useState('todas')
  const [filtroEstado,  setFiltroEstado]  = useState('todos')
  const [busqueda,      setBusqueda]      = useState('')
  const [cotizacionVisor,  setCotizacionVisor]  = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const queryClient = useQueryClient()

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', filtroSede, filtroEstado, busqueda],
    queryFn: () => api.cotizaciones.listar({
      sede:   filtroSede   !== 'todas' ? filtroSede   : undefined,
      estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
      buscar: busqueda || undefined,
    }),
    refetchInterval: 10000,
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }) => api.cotizaciones.actualizarEstado(id, estado),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cotizaciones'] }); toast({ title: 'Estado actualizado' }) },
    onError:   (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const mutEliminar = useMutation({
    mutationFn: (id) => api.cotizaciones.eliminar(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cotizaciones'] }); toast({ title: 'Cotización eliminada' }) },
    onError:   (err) => toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' }),
  })

  const stats = {
    total:          cotizaciones.length,
    aceptadas:      cotizaciones.filter(c => c.estado === 'aceptada').length,
    enviadas:       cotizaciones.filter(c => c.estado === 'enviada').length,
    montoAceptadas: cotizaciones.filter(c => c.estado === 'aceptada').reduce((a, c) => a + (c.total || 0), 0),
  }

  const abrirPDF = (id) => {
    const v = window.open(api.cotizaciones.urlHtml(id), '_blank')
    if (v) v.addEventListener('load', () => setTimeout(() => v.print(), 500))
  }

  const abrirWhatsApp = (c) => {
    const n = c.numero_telefono.replace(/\D/g, '')
    window.open(`https://wa.me/${n}?text=${encodeURIComponent(`Hola ${c.nombre_paciente}, te enviamos la cotización N° ${c.numero_cotizacion} por $${Number(c.total).toFixed(2)} USD. Respondé ACEPTAR para confirmar o RECHAZAR para cancelar.`)}`, '_blank')
  }

  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total"          valor={stats.total}          color="text-gray-700" />
        <StatCard label="Aceptadas"      valor={stats.aceptadas}      color="text-green-600" />
        <StatCard label="Enviadas"       valor={stats.enviadas}        color="text-amber-600" />
        <StatCard label="Monto aceptado" valor={`$${stats.montoAceptadas.toFixed(0)}`} color="text-blue-600"
          icono={<DollarSign className="w-4 h-4" />} />
      </div>

      {/* Controles — apilados en mobile, fila en desktop */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filtroSede} onValueChange={setFiltroSede}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sedes</SelectItem>
              <SelectItem value="principal">Sede Principal</SelectItem>
              <SelectItem value="secundaria">Sede Secundaria</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="aceptada">Aceptada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setMostrarFormulario(true)} className="bg-[#c9994a] hover:bg-[#b8873a] shrink-0">
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Nueva</span>
          </Button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-[#c9994a] border-t-transparent rounded-full mr-2" />
          Cargando...
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin cotizaciones</p>
          <p className="text-sm mt-1">Las cotizaciones aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map(cot => {
            const ec = ESTADOS_CONFIG[cot.estado] || ESTADOS_CONFIG.borrador
            return (
              <div key={cot.id} className="bg-white rounded-xl border shadow-sm p-4">

                {/* Fila superior: número + badges + monto */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-bold text-indigo-700 text-sm">{cot.numero_cotizacion}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ec.className}`}>{ec.label}</span>
                    {cot.generada_por_ia === 1 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Bot className="w-3 h-3" /> IA
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-gray-800">${Number(cot.total).toFixed(2)}</span>
                    <span className="text-xs text-gray-400 ml-1">USD</span>
                  </div>
                </div>

                {/* Info paciente */}
                <div className="mb-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium text-gray-800">{cot.nombre_paciente}</span>
                    {cot.nombre_contacto && cot.nombre_contacto !== cot.nombre_paciente && (
                      <span className="text-xs text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                        reg. como {cot.nombre_contacto}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                    <span>{cot.numero_telefono}</span>
                    <span>·</span>
                    <span>{cot.sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria'}</span>
                    <span>·</span>
                    <span>{formatearFecha(cot.creado_en)}</span>
                    {cot.total_visitas > 0 && (
                      <><span>·</span>
                      <span className="flex items-center gap-0.5 text-indigo-500">
                        <User className="w-3 h-3" />
                        {cot.total_visitas === 1 ? 'Nuevo' : `${cot.total_visitas} visitas`}
                      </span></>
                    )}
                  </div>
                </div>

                {/* Acciones — separadas en dos grupos en mobile */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1" onClick={() => setCotizacionVisor(cot.id)}>
                    <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Ver</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => abrirWhatsApp(cot)}>
                    <MessageCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">WA</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => abrirPDF(cot.id)}>
                    <Printer className="w-3.5 h-3.5" />
                  </Button>

                  <div className="flex-1" />

                  <Select value={cot.estado} onValueChange={estado => mutacionEstado.mutate({ id: cot.id, estado })}>
                    <SelectTrigger className="h-8 text-xs w-28 sm:w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="aceptada">Aceptada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" size="sm" className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { if (confirm(`¿Eliminar ${cot.numero_cotizacion}?`)) mutEliminar.mutate(cot.id) }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cotizacionVisor && (
        <VisorCotizacion cotizacionId={cotizacionVisor} abierto={!!cotizacionVisor} onCerrar={() => setCotizacionVisor(null)} />
      )}
      <FormularioCotizacion
        abierto={mostrarFormulario}
        onCerrar={() => setMostrarFormulario(false)}
        onCreada={() => queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })}
      />
    </div>
  )
}

function StatCard({ label, valor, color, icono }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className={`text-xl sm:text-2xl font-bold ${color} flex items-center gap-1`}>{icono}{valor}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
