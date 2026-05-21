import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Save, Settings, Copy, Check, Edit2, Power } from 'lucide-react'

export default function TabConfiguracion() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({})
  const [copiado, setCopiado] = useState(false)

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: api.configuracion.obtener,
  })

  const { data: catalogo = [], isLoading: cargandoCatalogo } = useQuery({
    queryKey: ['catalogo-admin'],
    queryFn: () => api.catalogo.listar({ activo: undefined }),
  })

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  const mutacionConfig = useMutation({
    mutationFn: api.configuracion.actualizar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracion'] })
      toast({ title: 'Configuración guardada correctamente' })
    },
    onError: (err) => toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' }),
  })

  const mutacionCatalogo = useMutation({
    mutationFn: ({ id, datos }) => api.catalogo.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-admin'] })
      queryClient.invalidateQueries({ queryKey: ['catalogo'] })
      toast({ title: 'Servicio actualizado' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const copiarWebhook = () => {
    const url = config?.webhook_url || `${window.location.origin}/api/webhook/whatsapp`
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  // Agrupar catálogo por categoría
  const catalogoPorCategoria = {}
  for (const s of catalogo) {
    if (!catalogoPorCategoria[s.categoria]) catalogoPorCategoria[s.categoria] = []
    catalogoPorCategoria[s.categoria].push(s)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-[#063740] border-t-transparent rounded-full mr-2" />
        Cargando configuración...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Config clínica */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#063740]" /> Información de la Clínica
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nombre de la clínica</Label>
            <Input
              value={form.nombre_clinica || ''}
              onChange={e => setForm(f => ({ ...f, nombre_clinica: e.target.value }))}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={form.telefono || ''}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email || ''}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Dirección</Label>
            <Input
              value={form.direccion || ''}
              onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Horarios de atención</Label>
            <Input
              value={form.horarios || ''}
              onChange={e => setForm(f => ({ ...f, horarios: e.target.value }))}
              placeholder="Lunes a Viernes: 9:00 - 18:00"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Sobre la clínica</Label>
            <Textarea
              value={form.sobre_clinica || ''}
              onChange={e => setForm(f => ({ ...f, sobre_clinica: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        {/* URL del webhook */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <Label className="text-xs text-gray-500 uppercase tracking-wider">URL del Webhook (Twilio)</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-sm bg-white border rounded px-3 py-2 text-gray-700 font-mono text-xs overflow-hidden overflow-ellipsis">
              {config?.webhook_url || `${window.location.origin.replace(':5173', ':3001')}/api/webhook/whatsapp`}
            </code>
            <Button variant="outline" size="sm" onClick={copiarWebhook}>
              {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Configurá esta URL en tu consola de Twilio como webhook de WhatsApp</p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => mutacionConfig.mutate(form)}
            disabled={mutacionConfig.isPending}
            className="bg-[#063740] hover:bg-[#063740]/90"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {mutacionConfig.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Catálogo de servicios */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
          Catálogo de Servicios
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Editá precios y activá/desactivá servicios. No se pueden agregar ni eliminar servicios desde aquí.
        </p>

        {cargandoCatalogo ? (
          <div className="text-center py-8 text-gray-400">Cargando catálogo...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(catalogoPorCategoria).map(([categoria, servicios]) => (
              <div key={categoria}>
                <h3 className="text-xs font-bold text-[#063740] uppercase tracking-wider mb-2 pb-1 border-b">
                  {categoria}
                </h3>
                <div className="space-y-1">
                  {servicios.map(s => (
                    <FilaServicio key={s.id} servicio={s} onActualizar={(datos) => mutacionCatalogo.mutate({ id: s.id, datos })} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FilaServicio({ servicio, onActualizar }) {
  const [editando, setEditando] = useState(false)
  const [precio, setPrecio] = useState(String(servicio.precio))

  const guardarPrecio = () => {
    const p = parseFloat(precio)
    if (isNaN(p) || p < 0) return
    onActualizar({ precio: p })
    setEditando(false)
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${servicio.activo ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate">{servicio.nombre}</span>
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
          servicio.sede === 'ambas' ? 'bg-blue-100 text-blue-600' :
          servicio.sede === 'principal' ? 'bg-teal-100 text-teal-600' :
          'bg-orange-100 text-orange-600'
        }`}>
          {servicio.sede}
        </span>
        {servicio.es_precio_desde ? <span className="ml-1 text-xs text-gray-400">desde</span> : null}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editando ? (
          <>
            <Input
              type="number"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              className="w-24 h-7 text-xs"
              min="0"
              step="0.01"
              onKeyDown={e => { if (e.key === 'Enter') guardarPrecio(); if (e.key === 'Escape') setEditando(false) }}
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs bg-[#063740]" onClick={guardarPrecio}>
              <Check className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-medium text-gray-700 w-20 text-right">${Number(servicio.precio).toFixed(2)}</span>
            <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={() => setEditando(true)} title="Editar precio">
              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </>
        )}

        <button
          onClick={() => onActualizar({ activo: !servicio.activo })}
          title={servicio.activo ? 'Desactivar' : 'Activar'}
          className={`w-8 h-5 rounded-full transition-colors relative ${servicio.activo ? 'bg-[#063740]' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${servicio.activo ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  )
}
