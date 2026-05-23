import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { Plus, Check, Trash2, Lightbulb, Star, Pin, X } from 'lucide-react'

const TIPOS = {
  pendiente:     { label: 'Pendiente',      icon: <Pin className="w-3.5 h-3.5" />,       bg: 'bg-rose-50   border-rose-200',   badge: 'bg-rose-100   text-rose-700'   },
  idea:          { label: 'Idea',           icon: <Lightbulb className="w-3.5 h-3.5" />, bg: 'bg-amber-50  border-amber-200',  badge: 'bg-amber-100  text-amber-700'  },
  recomendacion: { label: 'Recomendación',  icon: <Star className="w-3.5 h-3.5" />,      bg: 'bg-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
}

const FORM_VACIO = { titulo: '', descripcion: '', tipo: 'pendiente' }

export default function TabRecordatorios() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [filtro, setFiltro] = useState('todos')
  const queryClient = useQueryClient()

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['recordatorios'],
    queryFn: api.recordatorios.listar,
  })

  const mutCrear = useMutation({
    mutationFn: api.recordatorios.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios'] })
      setForm(FORM_VACIO)
      setMostrarForm(false)
      toast({ title: 'Recordatorio creado' })
    },
  })

  const mutToggle = useMutation({
    mutationFn: ({ id, completado }) => api.recordatorios.actualizar(id, { completado }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordatorios'] }),
  })

  const mutEliminar = useMutation({
    mutationFn: api.recordatorios.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordatorios'] })
      toast({ title: 'Eliminado' })
    },
  })

  const lista = filtro === 'todos'
    ? todos
    : filtro === 'completados'
    ? todos.filter(r => r.completado)
    : todos.filter(r => !r.completado && r.tipo === filtro)

  const pendientes = todos.filter(r => !r.completado).length

  const handleCrear = () => {
    if (!form.titulo.trim()) return toast({ title: 'Escribí un título', variant: 'destructive' })
    mutCrear.mutate(form)
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Recordatorios & Ideas</h2>
          <p className="text-xs text-gray-500 mt-0.5">{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setMostrarForm(true)} className="bg-[#c9994a] hover:bg-[#b8873a] text-white gap-1.5">
          <Plus className="w-4 h-4" /> Nuevo
        </Button>
      </div>

      {/* Formulario nuevo */}
      {mostrarForm && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm text-gray-700">Nuevo recordatorio</p>
            <button onClick={() => { setMostrarForm(false); setForm(FORM_VACIO) }}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <Input
            placeholder="Título *"
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleCrear()}
            autoFocus
          />
          <Input
            placeholder="Descripción (opcional)"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          />
          <div className="flex gap-2">
            {Object.entries(TIPOS).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setForm(f => ({ ...f, tipo: key }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.tipo === key ? t.badge + ' border-current' : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setMostrarForm(false); setForm(FORM_VACIO) }}>Cancelar</Button>
            <Button size="sm" className="bg-[#c9994a] hover:bg-[#b8873a]" onClick={handleCrear} disabled={mutCrear.isPending}>
              Guardar
            </Button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'todos',       label: 'Todos' },
          { key: 'pendiente',   label: '📌 Pendientes' },
          { key: 'idea',        label: '💡 Ideas' },
          { key: 'recomendacion', label: '⭐ Recomendaciones' },
          { key: 'completados', label: '✅ Completados' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filtro === f.key
                ? 'bg-indigo-600 text-white border-[#c9994a]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Sin recordatorios en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(r => {
            const tipo = TIPOS[r.tipo] || TIPOS.pendiente
            return (
              <div
                key={r.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  r.completado ? 'bg-gray-50 border-gray-100 opacity-60' : tipo.bg
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => mutToggle.mutate({ id: r.id, completado: !r.completado })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    r.completado ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {r.completado && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`${r.completado ? 'line-through text-gray-400' : 'text-gray-800'} font-medium text-sm`}>
                      {r.titulo}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tipo.badge}`}>
                      {tipo.label}
                    </span>
                  </div>
                  {r.descripcion && (
                    <p className="text-xs text-gray-500 mt-0.5">{r.descripcion}</p>
                  )}
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => mutEliminar.mutate(r.id)}
                  className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
