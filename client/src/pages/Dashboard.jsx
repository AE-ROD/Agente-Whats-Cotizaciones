import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import FmLogo from '@/components/FmLogo'
import TabInicio from '@/components/TabInicio'
import TabMensajes from '@/components/TabMensajes'
import TabTurnos from '@/components/TabTurnos'
import TabCotizaciones from '@/components/TabCotizaciones'
import TabContactos from '@/components/TabContactos'
import TabRecordatorios from '@/components/TabRecordatorios'
import TabConfiguracion from '@/components/TabConfiguracion'
import {
  LayoutDashboard, MessageCircle, Calendar, FileText,
  Users, Bell, Settings, Home, Menu, X, Wifi, WifiOff,
  Stethoscope,
} from 'lucide-react'

// Paleta: Salvia + Blush + Blanco
const SAGE    = '#5a8a6e'
const SAGE_L  = '#edf5f0'
const BLUSH   = '#c97b84'
const BLUSH_L = '#fdf0f2'
const GRAY_T  = '#374151'
const BORDER  = '#e5eee8'

const NAV = [
  { key: 'inicio',        label: 'Inicio',       icon: LayoutDashboard },
  { key: 'mensajes',      label: 'Mensajes',      icon: MessageCircle   },
  { key: 'turnos',        label: 'Turnos',        icon: Calendar        },
  { key: 'cotizaciones',  label: 'Cotizaciones',  icon: FileText        },
  { key: 'contactos',     label: 'Contactos',     icon: Users           },
  { key: 'recordatorios', label: 'Recordatorios', icon: Bell            },
  { key: 'configuracion', label: 'Configuración', icon: Settings        },
]

const TABS = {
  inicio: <TabInicio />, mensajes: <TabMensajes />, turnos: <TabTurnos />,
  cotizaciones: <TabCotizaciones />, contactos: <TabContactos />,
  recordatorios: <TabRecordatorios />, configuracion: <TabConfiguracion />,
}

export default function Dashboard() {
  const [activo,  setActivo]  = useState('inicio')
  const [abierto, setAbierto] = useState(false)

  const { data: wa } = useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn: api.whatsapp.estado,
    refetchInterval: 5000,
  })

  const ir = (k) => { setActivo(k); setAbierto(false) }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* Overlay móvil */}
      {abierto && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-sm" onClick={() => setAbierto(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col border-r
        bg-white transition-transform duration-300
        ${abierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `} style={{ borderColor: BORDER }}>

        {/* Logo */}
        <div className="px-5 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <FmLogo size={46} color={SAGE} />
            <div>
              <p className="font-semibold leading-none" style={{
                color: GRAY_T,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 15,
              }}>
                Od. Franyelis Moreno
              </p>
              <p className="text-xs mt-0.5 tracking-widest" style={{ color: '#9ca3af', letterSpacing: '0.14em', fontSize: 9 }}>
                ODONTÓLOGO GENERAL
              </p>
            </div>
            <button className="ml-auto md:hidden text-gray-400 hover:text-gray-600" onClick={() => setAbierto(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Divider salvia */}
          <div className="mt-5 h-px rounded-full" style={{ background: `linear-gradient(to right, ${SAGE}50, transparent)` }} />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive = activo === key
            return (
              <button key={key} onClick={() => ir(key)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? SAGE_L : 'transparent',
                  color:      isActive ? SAGE    : '#6b7280',
                }}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: SAGE }} />}
              </button>
            )
          })}
        </nav>

        {/* WhatsApp status */}
        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: wa?.conectado ? '#f0fdf4' : '#f9fafb', color: wa?.conectado ? '#166534' : '#9ca3af' }}>
            {wa?.conectado
              ? <><Wifi className="w-3.5 h-3.5" /><span>WhatsApp activo</span>
                  {wa.bot_activo && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </>
              : <><WifiOff className="w-3.5 h-3.5" /><span>Sin conexión</span></>
            }
          </div>
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <Home className="w-3.5 h-3.5" /> Volver al inicio
          </Link>
        </div>
      </aside>

      {/* ── Contenido ───────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col">

        {/* Header móvil */}
        <header className="md:hidden sticky top-0 z-10 bg-white border-b flex items-center gap-3 px-4 py-3" style={{ borderColor: BORDER }}>
          <button onClick={() => setAbierto(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
          <FmLogo size={30} color={SAGE} />
          <span className="font-medium text-sm" style={{ color: GRAY_T, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}>
            Od. Franyelis
          </span>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: SAGE_L, color: SAGE }}>
            {NAV.find(n => n.key === activo)?.label}
          </span>
        </header>

        {/* Contenido */}
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">
            {TABS[activo]}
          </div>
        </main>
      </div>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t flex items-center justify-around px-2 py-2" style={{ borderColor: BORDER }}>
        {NAV.slice(0, 6).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => ir(key)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
            style={{ color: activo === key ? SAGE : '#9ca3af' }}>
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium">{label.slice(0, 6)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
