import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePaletaCtx } from '@/pages/Dashboard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Edit2, Check, Package } from 'lucide-react'

export default function TabServicios() {
  const paleta = usePaletaCtx()
  const queryClient = useQueryClient()

  const { data: catalogo = [], isLoading } = useQuery({
    queryKey: ['catalogo-admin'],
    queryFn: () => api.catalogo.listar({ activo: undefined }),
  })

  const mutacion = useMutation({
    mutationFn: ({ id, datos }) => api.catalogo.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-admin'] })
      queryClient.invalidateQueries({ queryKey: ['catalogo'] })
      toast({ title: 'Servicio actualizado' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  // Agrupar por categoría
  const catalogoPorCategoria = {}
  for (const s of catalogo) {
    if (!catalogoPorCategoria[s.categoria]) catalogoPorCategoria[s.categoria] = []
    catalogoPorCategoria[s.categoria].push(s)
  }

  const totalActivos = catalogo.filter(s => s.activo).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 gap-2">
        <div className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"
          style={{ borderColor: `${paleta?.primario}40`, borderLeftColor: paleta?.primario }} />
        Cargando catálogo...
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Header con stats globales */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${paleta?.primario}15` }}>
            <Package className="w-5 h-5" style={{ color: paleta?.primario }} />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 leading-tight">Catálogo de Servicios</h1>
            <p className="text-xs text-gray-400">
              {totalActivos} de {catalogo.length} activos ·{' '}
              {Object.keys(catalogoPorCategoria).length} categorías
            </p>
          </div>
        </div>
      </div>

      {/* Nota */}
      <p className="text-sm text-gray-500 bg-slate-50 border rounded-lg px-4 py-2.5">
        Editá precios y activá/desactivá servicios — los cambios se aplican de inmediato al agente Anelis.
      </p>

      {/* Catálogo con tabs */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <CatalogoPorTabs
          catalogoPorCategoria={catalogoPorCategoria}
          paleta={paleta}
          onActualizar={(id, datos) => mutacion.mutate({ id, datos })}
        />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Tabs por categoría
// ──────────────────────────────────────────────
function CatalogoPorTabs({ catalogoPorCategoria, paleta, onActualizar }) {
  const categorias = Object.keys(catalogoPorCategoria)
  const [tabActiva, setTabActiva] = useState(categorias[0] || '')

  const servicios = catalogoPorCategoria[tabActiva]
    || catalogoPorCategoria[categorias[0]]
    || []

  const activos   = servicios.filter(s => s.activo).length
  const inactivos = servicios.length - activos

  return (
    <div>
      {/* Pills de categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {categorias.map(cat => {
          const count    = catalogoPorCategoria[cat].length
          const isActive = cat === tabActiva
          return (
            <button
              key={cat}
              onClick={() => setTabActiva(cat)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 border transition-all duration-150"
              style={isActive
                ? { background: paleta?.primario, color: '#fff', borderColor: paleta?.primario }
                : { background: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' }
              }
            >
              {cat}
              <span className={`text-xs font-bold rounded-full px-1.5 py-px min-w-[20px] text-center leading-none ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mini stats */}
      <div className="flex items-center gap-2 mt-3 mb-3 text-xs text-gray-400">
        <span className="font-semibold" style={{ color: paleta?.primario }}>{activos} activos</span>
        {inactivos > 0 && <><span>·</span><span>{inactivos} inactivos</span></>}
        <span>·</span>
        <span>{servicios.length} en total</span>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border overflow-hidden">
        <div className="grid gap-2 px-4 py-2 bg-slate-50 border-b text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none"
          style={{ gridTemplateColumns: '1fr 72px 140px 46px' }}>
          <span>Servicio</span>
          <span className="text-center">Sede</span>
          <span className="text-right">Precio</span>
          <span className="text-center">On</span>
        </div>
        <div className="divide-y">
          {servicios.map(s => (
            <FilaTabla
              key={s.id}
              servicio={s}
              paleta={paleta}
              onActualizar={(datos) => onActualizar(s.id, datos)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Fila de tabla
// ──────────────────────────────────────────────
function FilaTabla({ servicio: s, paleta, onActualizar }) {
  const [editando, setEditando] = useState(false)
  const [precio, setPrecio]     = useState(String(s.precio))

  const guardarPrecio = () => {
    const p = parseFloat(precio)
    if (isNaN(p) || p < 0) return
    onActualizar({ precio: p })
    setEditando(false)
  }

  const sedeBadge = {
    ambas:     { label: 'Ambas', cls: 'bg-blue-50 text-blue-600'    },
    principal: { label: 'Ppal.', cls: 'bg-teal-50 text-teal-600'    },
  }[s.sede] ?? { label: s.sede,  cls: 'bg-orange-50 text-orange-600' }

  return (
    <div
      className="grid gap-2 items-center px-4 py-3 text-sm transition-colors"
      style={{
        gridTemplateColumns: '1fr 72px 140px 46px',
        background: s.activo ? 'white' : '#FAFAFA',
        opacity:    s.activo ? 1 : 0.55,
      }}
    >
      {/* Nombre */}
      <div className="min-w-0">
        <p className="font-medium text-gray-800 truncate leading-tight">{s.nombre}</p>
        {s.es_precio_desde && <span className="text-[11px] text-gray-400">desde</span>}
      </div>

      {/* Sede */}
      <div className="flex justify-center">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${sedeBadge.cls}`}>
          {sedeBadge.label}
        </span>
      </div>

      {/* Precio editable */}
      <div className="flex items-center justify-end gap-1">
        {editando ? (
          <>
            <Input
              type="number"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              className="w-20 h-7 text-xs text-right"
              min="0"
              step="0.01"
              onKeyDown={e => {
                if (e.key === 'Enter') guardarPrecio()
                if (e.key === 'Escape') setEditando(false)
              }}
              autoFocus
            />
            <Button size="sm" className="h-7 w-7 p-0 shrink-0" style={{ background: paleta?.primario }} onClick={guardarPrecio}>
              <Check className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="group flex items-center gap-1.5 font-medium text-gray-700 hover:text-gray-900 transition-colors"
            title="Editar precio"
          >
            <span>${Number(s.precio).toFixed(2)}</span>
            <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
          </button>
        )}
      </div>

      {/* Toggle activo */}
      <div className="flex justify-center">
        <button
          onClick={() => onActualizar({ activo: !s.activo })}
          title={s.activo ? 'Desactivar' : 'Activar'}
          className="w-8 h-5 rounded-full transition-colors relative shrink-0"
          style={{ background: s.activo ? paleta?.primario : '#D1D5DB' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
            style={{ transform: s.activo ? 'translateX(14px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
    </div>
  )
}
