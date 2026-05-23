import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  Users, Search, Phone, MessageCircle, Calendar, FileText,
  DollarSign, X, Edit2, Check, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'

function formatearFecha(fecha) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TabContactos() {
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(null)
  const queryClient = useQueryClient()

  const { data: contactos = [], isLoading } = useQuery({
    queryKey: ['contactos', busqueda],
    queryFn: () => api.contactos.listar({ buscar: busqueda || undefined }),
    refetchInterval: 15000,
  })

  const mutActualizar = useMutation({
    mutationFn: ({ numero, datos }) => api.contactos.actualizar(numero, datos),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); toast({ title: 'Contacto actualizado' }) },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const mutEliminar = useMutation({
    mutationFn: (numero) => api.contactos.eliminar(numero),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contactos'] }); toast({ title: 'Contacto eliminado' }); setExpandido(null) },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const stats = {
    total:       contactos.length,
    nuevos:      contactos.filter(c => c.total_visitas <= 1).length,
    recurrentes: contactos.filter(c => c.total_visitas > 1).length,
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total"       valor={stats.total}       color="text-gray-700" />
        <StatCard label="Nuevos"      valor={stats.nuevos}      color="text-amber-600" />
        <StatCard label="Recurrentes" valor={stats.recurrentes} color="text-[#c9994a]" />
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="animate-spin w-6 h-6 border-2 border-[#c9994a] border-t-transparent rounded-full mr-2" /> Cargando...
        </div>
      ) : contactos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin contactos aún</p>
          <p className="text-sm mt-1">Los pacientes que escriban por WhatsApp aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contactos.map(c => (
            <TarjetaContacto
              key={c.numero_telefono}
              contacto={c}
              expandido={expandido === c.numero_telefono}
              onExpandir={() => setExpandido(expandido === c.numero_telefono ? null : c.numero_telefono)}
              onActualizar={(datos) => mutActualizar.mutate({ numero: c.numero_telefono, datos })}
              onEliminar={() => {
                if (confirm(`¿Eliminar a ${c.nombre || c.numero_telefono}?`))
                  mutEliminar.mutate(c.numero_telefono)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TarjetaContacto({ contacto: c, expandido, onExpandir, onActualizar, onEliminar }) {
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [editandoNotas,  setEditandoNotas]  = useState(false)
  const [nombre, setNombre] = useState(c.nombre || '')
  const [notas,  setNotas]  = useState(c.notas  || '')

  const guardarNombre = () => { onActualizar({ nombre: nombre.trim() || null }); setEditandoNombre(false) }
  const guardarNotas  = () => { onActualizar({ notas:  notas.trim()  || null }); setEditandoNotas(false)  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Fila principal */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {(c.nombre || c.numero_telefono).charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm truncate">{c.nombre || '(Sin nombre)'}</span>
            {c.total_visitas <= 1
              ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Nuevo</span>
              : <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">{c.total_visitas} visitas</span>
            }
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{c.numero_telefono}</span>
          </div>
        </div>

        {/* Métricas rápidas — solo en desktop */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400 shrink-0">
          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{c.total_mensajes}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{c.total_turnos}</span>
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{c.total_cotizaciones}</span>
          {c.monto_aceptado > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <DollarSign className="w-3.5 h-3.5" />${Number(c.monto_aceptado).toFixed(0)}
            </span>
          )}
        </div>

        <button onClick={onExpandir} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
          {expandido ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div className="border-t bg-gray-50 p-4 space-y-4">

          {/* Métricas en mobile */}
          <div className="flex flex-wrap gap-3 lg:hidden text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-gray-400" />{c.total_mensajes} mensajes</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />{c.total_turnos} turnos</span>
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-gray-400" />{c.total_cotizaciones} cotizaciones</span>
            {c.monto_aceptado > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <DollarSign className="w-4 h-4" />${Number(c.monto_aceptado).toFixed(0)} USD
              </span>
            )}
          </div>

          {/* Editar nombre */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre</p>
            {editandoNombre ? (
              <div className="flex gap-2">
                <Input value={nombre} onChange={e => setNombre(e.target.value)} className="h-8 text-sm flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') guardarNombre(); if (e.key === 'Escape') setEditandoNombre(false) }} autoFocus />
                <Button size="sm" className="h-8 bg-indigo-600 shrink-0" onClick={guardarNombre}><Check className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-8 shrink-0" onClick={() => setEditandoNombre(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-800">{c.nombre || '(Sin nombre)'}</span>
                <button onClick={() => setEditandoNombre(true)} className="text-gray-400 hover:text-[#c9994a] transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notas del paciente</p>
            {editandoNotas ? (
              <div className="space-y-2">
                <textarea value={notas} onChange={e => setNotas(e.target.value)}
                  className="w-full text-sm border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#c9994a] bg-white"
                  rows={3} placeholder="Alergias, preferencias, observaciones..." autoFocus />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-indigo-600 h-8" onClick={guardarNotas}><Check className="w-3.5 h-3.5 mr-1" />Guardar</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditandoNotas(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-600 flex-1">{c.notas || <span className="text-gray-400 italic">Sin notas</span>}</p>
                <button onClick={() => setEditandoNotas(true)} className="text-gray-400 hover:text-[#c9994a] transition-colors shrink-0 mt-0.5">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 text-xs text-gray-500">
            <span>Primer contacto: <strong>{formatearFecha(c.creado_en)}</strong></span>
            <span>Última actividad: <strong>{formatearFecha(c.ultima_actividad)}</strong></span>
          </div>

          {/* Eliminar */}
          <div className="pt-2 border-t">
            <button onClick={onEliminar} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar contacto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, valor, color }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{valor}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
