import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { FileText, Plus, Eye, MessageCircle, Printer, Bot, Search, DollarSign } from 'lucide-react'
import VisorCotizacion from './VisorCotizacion'
import FormularioCotizacion from './FormularioCotizacion'

const ESTADOS_CONFIG = {
  borrador: { label: 'Borrador', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  enviada: { label: 'Enviada', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  aceptada: { label: 'Aceptada', className: 'bg-green-100 text-green-700 border-green-200' },
  rechazada: { label: 'Rechazada', className: 'bg-red-100 text-red-700 border-red-200' },
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function TabCotizaciones() {
  const [filtroSede, setFiltroSede] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [cotizacionVisor, setCotizacionVisor] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const queryClient = useQueryClient()

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', filtroSede, filtroEstado, busqueda],
    queryFn: () => api.cotizaciones.listar({
      sede: filtroSede !== 'todas' ? filtroSede : undefined,
      estado: filtroEstado !== 'todos' ? filtroEstado : undefined,
      buscar: busqueda || undefined,
    }),
    refetchInterval: 10000,
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, estado }) => api.cotizaciones.actualizarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast({ title: 'Estado actualizado' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const stats = {
    total: cotizaciones.length,
    aceptadas: cotizaciones.filter(c => c.estado === 'aceptada').length,
    enviadas: cotizaciones.filter(c => c.estado === 'enviada').length,
    montoAceptadas: cotizaciones
      .filter(c => c.estado === 'aceptada')
      .reduce((acc, c) => acc + (c.total || 0), 0),
  }

  const abrirPDF = (id) => {
    const url = api.cotizaciones.urlHtml(id)
    const ventana = window.open(url, '_blank')
    if (ventana) {
      ventana.addEventListener('load', () => setTimeout(() => ventana.print(), 500))
    }
  }

  const abrirWhatsApp = (c) => {
    const numero = c.numero_telefono.replace(/\D/g, '')
    const texto = encodeURIComponent(
      `Hola ${c.nombre_paciente}, te enviamos la cotización N° ${c.numero_cotizacion} por $${Number(c.total).toFixed(2)} USD. Respondé ACEPTAR para confirmar o RECHAZAR para cancelar.`
    )
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" valor={stats.total} color="text-gray-700" />
        <StatCard label="Aceptadas" valor={stats.aceptadas} color="text-green-600" />
        <StatCard label="Enviadas" valor={stats.enviadas} color="text-amber-600" />
        <StatCard
          label="Monto aceptado"
          valor={`$${stats.montoAceptadas.toFixed(0)} USD`}
          color="text-blue-600"
          icono={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filtroSede} onValueChange={setFiltroSede}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sede" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las sedes</SelectItem>
            <SelectItem value="principal">Sede Principal</SelectItem>
            <SelectItem value="secundaria">Sede Secundaria</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="aceptada">Aceptada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por paciente o N° cotización..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          onClick={() => setMostrarFormulario(true)}
          className="bg-[#063740] hover:bg-[#063740]/90 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Nueva Cotización
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-[#063740] border-t-transparent rounded-full mr-2" />
          Cargando cotizaciones...
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin cotizaciones</p>
          <p className="text-sm">Las cotizaciones generadas por IA o manualmente aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map(cot => {
            const estadoConfig = ESTADOS_CONFIG[cot.estado] || ESTADOS_CONFIG.borrador
            return (
              <div key={cot.id} className="bg-white rounded-lg border shadow-sm p-4">
                <div className="flex items-start gap-4">
                  {/* Izquierda */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-[#063740] text-sm">{cot.numero_cotizacion}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoConfig.className}`}>
                        {estadoConfig.label}
                      </span>
                      {cot.generada_por_ia === 1 && (
                        <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Bot className="w-3 h-3" /> IA
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium text-gray-800">{cot.nombre_paciente}</span>
                      <span className="text-gray-400">{cot.numero_telefono}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span>{cot.sede === 'principal' ? 'Sede Principal' : 'Sede Secundaria'}</span>
                      <span>{formatearFecha(cot.creado_en)}</span>
                      {cot.validez_dias && <span>{cot.validez_dias} días validez</span>}
                    </div>
                  </div>

                  {/* Derecha */}
                  <div className="shrink-0 text-right">
                    <div className="text-xl font-bold text-gray-800">
                      ${Number(cot.total).toFixed(2)}
                      <span className="text-xs text-gray-400 font-normal ml-1">USD</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setCotizacionVisor(cot.id)}
                        title="Ver cotización"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => abrirWhatsApp(cot)}
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1" /> WA
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => abrirPDF(cot.id)}
                        title="Imprimir / PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>

                      <Select
                        value={cot.estado}
                        onValueChange={(estado) => mutacionEstado.mutate({ id: cot.id, estado })}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="borrador">Borrador</SelectItem>
                          <SelectItem value="enviada">Enviada</SelectItem>
                          <SelectItem value="aceptada">Aceptada</SelectItem>
                          <SelectItem value="rechazada">Rechazada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Visor */}
      {cotizacionVisor && (
        <VisorCotizacion
          cotizacionId={cotizacionVisor}
          abierto={!!cotizacionVisor}
          onCerrar={() => setCotizacionVisor(null)}
        />
      )}

      {/* Formulario nueva cotización */}
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
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className={`text-2xl font-bold ${color} flex items-center gap-1`}>
        {icono}{valor}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
