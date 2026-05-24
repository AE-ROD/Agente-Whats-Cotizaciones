import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePaletaCtx } from '@/pages/Dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Save, Settings, Wifi, WifiOff, Bot } from 'lucide-react'

export default function TabConfiguracion() {
  const paleta = usePaletaCtx()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({})
  const [copiado, setCopiado] = useState(false)

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: api.configuracion.obtener,
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

  const copiarWebhook = () => {
    const url = config?.webhook_url || `${window.location.origin}/api/webhook/whatsapp`
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  // Estado del agente WhatsApp (polling cada 3s)
  const { data: waEstado } = useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn: api.whatsapp.estado,
    refetchInterval: 3000,
  })

  const { data: waQR } = useQuery({
    queryKey: ['whatsapp-qr'],
    queryFn: api.whatsapp.qr,
    refetchInterval: waEstado?.conectado ? false : 3000,
    enabled: !waEstado?.conectado,
  })

  const mutacionBot = useMutation({
    mutationFn: (activo) => api.whatsapp.toggleBot(activo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-estado'] })
      toast({ title: data.bot_activo ? '🤖 Agente activado' : '⏸ Agente pausado' })
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full mr-2" style={{ borderColor: `${paleta?.primario}40`, borderLeftColor: paleta?.primario }} />
        Cargando configuración...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Panel del Agente WhatsApp */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color: paleta?.primario }} /> Agente WhatsApp
        </h2>

        {/* Estado de conexión */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 mb-4">
          <div className="flex items-center gap-3">
            {waEstado?.conectado
              ? <Wifi className="w-5 h-5 text-green-500" />
              : <WifiOff className="w-5 h-5 text-gray-400" />
            }
            <div>
              <p className="font-medium text-sm text-gray-800">
                {waEstado?.conectado ? 'WhatsApp conectado' : waEstado?.estado === 'esperando_qr' ? 'Esperando escaneo de QR' : 'Desconectado'}
              </p>
              <p className="text-xs text-gray-500">
                {waEstado?.conectado ? 'El agente puede enviar y recibir mensajes' : 'Escaneá el QR para conectar'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            waEstado?.conectado ? 'bg-green-100 text-green-700' :
            waEstado?.estado === 'esperando_qr' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {waEstado?.conectado ? 'Conectado' : waEstado?.estado === 'esperando_qr' ? 'Aguardando QR' : 'Offline'}
          </span>
        </div>

        {/* QR para escanear */}
        {!waEstado?.conectado && waQR?.qr && (
          <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-lg mb-4">
            <p className="text-sm text-gray-600 text-center">
              Abrí WhatsApp en tu celular → <strong>Dispositivos vinculados</strong> → <strong>Vincular un dispositivo</strong> → escaneá este QR
            </p>
            <img src={waQR.qr} alt="QR WhatsApp" className="w-52 h-52 rounded-lg shadow" />
            <p className="text-xs text-gray-400">El QR se actualiza automáticamente cada 15 segundos</p>
          </div>
        )}

        {!waEstado?.conectado && !waQR?.qr && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
            <div className="animate-spin w-4 h-4 border-2 border-[#c9994a] border-t-transparent rounded-full" />
            Iniciando WhatsApp...
          </div>
        )}

        {/* Toggle bot activo/inactivo */}
        {waEstado?.conectado && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-800">Respuestas automáticas</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {waEstado?.bot_activo ? 'Sarah responde mensajes automáticamente' : 'Agente pausado — respondé manualmente'}
              </p>
            </div>
            <button
              onClick={() => mutacionBot.mutate(!waEstado?.bot_activo)}
              disabled={mutacionBot.isPending}
              className="w-12 h-6 rounded-full transition-colors relative shrink-0"
              style={{ background: waEstado?.bot_activo ? paleta?.primario : '#D1D5DB' }}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${waEstado?.bot_activo ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
      </div>

      {/* Config clínica */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: paleta?.primario }} /> Información de la Clínica
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

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => mutacionConfig.mutate(form)}
            disabled={mutacionConfig.isPending}
            style={{ background: paleta?.primario }}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {mutacionConfig.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

    </div>
  )
}
