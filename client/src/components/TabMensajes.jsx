import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MessageCircle, User, Bot } from 'lucide-react'

function formatearFechaHora(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TabMensajes() {
  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ['mensajes'],
    queryFn: api.mensajes.listar,
    refetchInterval: 10000,
  })

  // Agrupar por número de teléfono
  const conversaciones = {}
  for (const m of mensajes) {
    if (!conversaciones[m.numero_telefono]) {
      conversaciones[m.numero_telefono] = []
    }
    conversaciones[m.numero_telefono].push(m)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-[#063740] border-t-transparent rounded-full mr-2" />
        Cargando mensajes...
      </div>
    )
  }

  if (mensajes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">Sin mensajes aún</p>
        <p className="text-sm">Los mensajes de WhatsApp aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Conversaciones recientes</h2>
        <span className="text-sm text-gray-500">{Object.keys(conversaciones).length} contactos</span>
      </div>

      {Object.entries(conversaciones).map(([numero, msgs]) => (
        <div key={numero} className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* Header de conversación */}
          <div className="bg-[#063740] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#a8781a] rounded-full flex items-center justify-center text-sm font-bold">
                {numero.slice(-2)}
              </div>
              <span className="font-medium text-sm">{numero}</span>
            </div>
            <span className="text-xs text-teal-200">{msgs.length} mensajes</span>
          </div>

          {/* Mensajes */}
          <div className="divide-y max-h-64 overflow-y-auto">
            {msgs.slice(0, 10).map((m) => (
              <div key={m.id} className={`px-4 py-3 flex gap-3 ${m.remitente === 'asistente' ? 'bg-teal-50' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  m.remitente === 'usuario' ? 'bg-gray-200' : 'bg-[#063740]'
                }`}>
                  {m.remitente === 'usuario'
                    ? <User className="w-4 h-4 text-gray-600" />
                    : <Bot className="w-4 h-4 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-600">
                      {m.remitente === 'usuario' ? 'Paciente' : 'Sarah (IA)'}
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
