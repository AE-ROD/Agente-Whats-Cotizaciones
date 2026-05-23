import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MessageCircle, User, Bot, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

function formatearFechaHora(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export default function TabMensajes() {
  const queryClient = useQueryClient()

  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ['mensajes'],
    queryFn: api.mensajes.listar,
    refetchInterval: 10000,
  })

  const mutEliminar = useMutation({
    mutationFn: (numero) => api.mensajes.eliminar(numero),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mensajes'] }); toast({ title: 'Conversación eliminada' }) },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  const conversaciones = {}
  for (const m of mensajes) {
    if (!conversaciones[m.numero_telefono]) conversaciones[m.numero_telefono] = []
    conversaciones[m.numero_telefono].push(m)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-[#c9994a] border-t-transparent rounded-full mr-2" />
        Cargando mensajes...
      </div>
    )
  }

  if (mensajes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Sin mensajes aún</p>
        <p className="text-sm mt-1">Los mensajes de WhatsApp aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Conversaciones recientes</h2>
        <span className="text-sm text-gray-500">{Object.keys(conversaciones).length} contactos</span>
      </div>

      {Object.entries(conversaciones).map(([numero, msgs]) => (
        <div key={numero} className="bg-white rounded-xl border shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-[#1a1d2e] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9994a] rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {(msgs[0]?.nombre_contacto || numero).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm leading-tight truncate max-w-[160px] sm:max-w-none">
                  {msgs[0]?.nombre_contacto || numero}
                </p>
                {msgs[0]?.total_visitas != null && (
                  msgs[0].total_visitas <= 1
                    ? <span className="text-xs bg-amber-500/80 px-2 py-0.5 rounded-full shrink-0">Nuevo</span>
                    : <span className="text-xs bg-[#c9994a]/60 px-2 py-0.5 rounded-full shrink-0">{msgs[0].total_visitas} visitas</span>
                )}
              </div>
              {msgs[0]?.nombre_contacto && (
                <p className="text-xs text-slate-400 truncate">{numero}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <span className="text-xs text-slate-400 hidden sm:block">{msgs.length} msg</span>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar conversación con ${msgs[0]?.nombre_contacto || numero}?`))
                    mutEliminar.mutate(numero)
                }}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Eliminar conversación"
              >
                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-300" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="divide-y max-h-72 overflow-y-auto">
            {msgs.slice(0, 10).map((m) => (
              <div key={m.id} className={`px-4 py-3 flex gap-3 ${m.remitente === 'asistente' ? 'bg-indigo-50/50' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  m.remitente === 'usuario' ? 'bg-gray-200' : 'bg-indigo-600'
                }`}>
                  {m.remitente === 'usuario'
                    ? <User className="w-3.5 h-3.5 text-gray-600" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium text-gray-600">
                      {m.remitente === 'usuario' ? (msgs[0]?.nombre_contacto || 'Paciente') : 'Sarah (IA)'}
                    </span>
                    <span className="text-xs text-gray-400">{formatearFechaHora(m.recibido_en)}</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{m.contenido_mensaje}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
