import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Calendar, Clock, User, Phone, Plus, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const ESTADOS_COLORES = {
  pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmado: 'bg-green-100 text-green-700 border-green-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
  completado: 'bg-blue-100 text-blue-700 border-blue-200',
}

const FORM_INICIAL = { nombre_paciente: '', numero_telefono: '', fecha_turno: '', tipo_turno: '', notas: '' }

export default function TabTurnos() {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const queryClient = useQueryClient()

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ['turnos'],
    queryFn: api.turnos.listar,
    refetchInterval: 15000,
  })

  const mutacion = useMutation({
    mutationFn: ({ id, estado }) => api.turnos.actualizar(id, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] })
      toast({ title: 'Turno actualizado' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const mutCrear = useMutation({
    mutationFn: (datos) => api.turnos.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] })
      toast({ title: 'Turno creado correctamente' })
      setModalAbierto(false)
      setForm(FORM_INICIAL)
    },
    onError: (err) => toast({ title: 'Error al crear turno', description: err.message, variant: 'destructive' }),
  })

  const handleCrear = () => {
    if (!form.nombre_paciente || !form.fecha_turno || !form.tipo_turno) {
      toast({ title: 'Completá nombre, fecha y tipo de turno', variant: 'destructive' })
      return
    }
    mutCrear.mutate(form)
  }

  const turnosFiltrados = filtroEstado === 'todos'
    ? turnos
    : turnos.filter(t => t.estado === filtroEstado)

  const stats = {
    total: turnos.length,
    confirmados: turnos.filter(t => t.estado === 'confirmado').length,
    pendientes: turnos.filter(t => t.estado === 'pendiente').length,
    cancelados: turnos.filter(t => t.estado === 'cancelado').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-[#063740] border-t-transparent rounded-full mr-2" />
        Cargando turnos...
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Modal nuevo turno */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">Nuevo Turno</h3>
              <button onClick={() => { setModalAbierto(false); setForm(FORM_INICIAL) }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nombre del paciente *</Label>
                <Input value={form.nombre_paciente} onChange={e => setForm(f => ({ ...f, nombre_paciente: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.numero_telefono} onChange={e => setForm(f => ({ ...f, numero_telefono: e.target.value }))} placeholder="+54 9 11 ..." />
              </div>
              <div>
                <Label>Fecha y hora *</Label>
                <Input type="datetime-local" value={form.fecha_turno} onChange={e => setForm(f => ({ ...f, fecha_turno: e.target.value }))} />
              </div>
              <div>
                <Label>Tipo de consulta *</Label>
                <Input value={form.tipo_turno} onChange={e => setForm(f => ({ ...f, tipo_turno: e.target.value }))} placeholder="Ej: Limpieza, Extracción..." />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="outline" onClick={() => { setModalAbierto(false); setForm(FORM_INICIAL) }}>Cancelar</Button>
              <Button onClick={handleCrear} disabled={mutCrear.isPending} className="bg-[#063740] hover:bg-[#063740]/90">
                {mutCrear.isPending ? 'Guardando...' : 'Guardar turno'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" valor={stats.total} color="text-gray-700" />
        <StatCard label="Confirmados" valor={stats.confirmados} color="text-green-600" />
        <StatCard label="Pendientes" valor={stats.pendientes} color="text-yellow-600" />
        <StatCard label="Cancelados" valor={stats.cancelados} color="text-red-600" />
      </div>

      {/* Filtro + botón nuevo */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setModalAbierto(true)} className="bg-[#063740] hover:bg-[#063740]/90 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nuevo turno
        </Button>
        <span className="text-sm text-gray-400">|</span>
        <span className="text-sm text-gray-500">Filtrar:</span>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="confirmado">Confirmados</SelectItem>
            <SelectItem value="completado">Completados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">{turnosFiltrados.length} turno(s)</span>
      </div>

      {/* Lista */}
      {turnosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay turnos con este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turnosFiltrados.map(turno => (
            <div key={turno.id} className="bg-white rounded-lg border shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ESTADOS_COLORES[turno.estado] || 'bg-gray-100'}`}>
                      {turno.estado}
                    </span>
                    <span className="text-xs text-gray-400">#{turno.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-800">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{turno.nombre_paciente || 'Sin nombre'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{turno.numero_telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[#063740]" />
                    <span>{formatearFecha(turno.fecha_turno)}</span>
                  </div>
                  {turno.tipo_turno && (
                    <div className="text-sm text-gray-500 mt-1">
                      Tipo: <span className="text-gray-700">{turno.tipo_turno}</span>
                    </div>
                  )}
                  {turno.notas && (
                    <p className="text-sm text-gray-500 mt-1 italic">{turno.notas}</p>
                  )}
                </div>

                {/* Cambiar estado */}
                <div className="shrink-0">
                  <Select
                    value={turno.estado}
                    onValueChange={(estado) => mutacion.mutate({ id: turno.id, estado })}
                  >
                    <SelectTrigger className="w-36 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{valor}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
