import { useState, useMemo, createContext, useContext } from 'react'
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
import TabServicios from '@/components/TabServicios'
import TabConfiguracion from '@/components/TabConfiguracion'
import {
  LayoutDashboard, MessageCircle, Calendar, FileText,
  Users, Bell, Settings, Home, Wifi, WifiOff, Package,
} from 'lucide-react'

// ── Hook de paleta dinámica por hora ────────────────────────────────────────
export function usePaleta() {
  return useMemo(() => {
    const h = new Date().getHours()
    if (h >= 6 && h < 13) return {
      saludo:    'Buenos días',
      emoji:     '⛅',
      gradiente: 'linear-gradient(135deg, #6B7FC4 0%, #ADBCEA 100%)',
      primario:  '#6B7FC4',
      primarioD: '#5A6EB3',
      chip:      '#C8D5F5',
    }
    if (h >= 13 && h < 20) return {
      saludo:    'Buenas tardes',
      emoji:     '☀️',
      gradiente: 'linear-gradient(135deg, #4A5A9C 0%, #7885C8 100%)',
      primario:  '#4A5A9C',
      primarioD: '#3A4A8C',
      chip:      '#C8D5F5',
    }
    return {
      saludo:    'Buenas noches',
      emoji:     '🌙',
      gradiente: 'linear-gradient(135deg, #0B1D3A 0%, #1a3870 100%)',
      primario:  '#0B1D3A',
      primarioD: '#071429',
      chip:      '#C8D5F5',
    }
  }, [])
}

// Context para que los tabs accedan a la paleta sin prop drilling
export const PaletaContext = createContext(null)
export function usePaletaCtx() { return useContext(PaletaContext) }

// Context de navegación — permite que TabInicio navegue a otros tabs
export const NavContext = createContext(null)
export function useNavCtx() { return useContext(NavContext) }

// ── Navegación ───────────────────────────────────────────────────────────────
const NAV = [
  { key: 'inicio',        label: 'Inicio',        icon: LayoutDashboard },
  { key: 'mensajes',      label: 'Mensajes',       icon: MessageCircle   },
  { key: 'turnos',        label: 'Turnos',         icon: Calendar        },
  { key: 'cotizaciones',  label: 'Cotizaciones',   icon: FileText        },
  { key: 'contactos',     label: 'Contactos',      icon: Users           },
  { key: 'recordatorios', label: 'Recordatorios',  icon: Bell            },
  { key: 'servicios',     label: 'Servicios',      icon: Package         },
  { key: 'configuracion', label: 'Configuración',  icon: Settings        },
]

const TABS = {
  inicio:        <TabInicio />,
  mensajes:      <TabMensajes />,
  turnos:        <TabTurnos />,
  cotizaciones:  <TabCotizaciones />,
  contactos:     <TabContactos />,
  recordatorios: <TabRecordatorios />,
  servicios:     <TabServicios />,
  configuracion: <TabConfiguracion />,
}

// ── Colores fijos del sistema ────────────────────────────────────────────────
const BG    = '#F8FAFC'
const CARD  = '#FFFFFF'
const BORDR = '#E2E8F0'
const TXT1  = '#1E293B'
const TXT2  = '#64748B'

export default function Dashboard() {
  const [activo, setActivo] = useState('inicio')
  const paleta = usePaleta()

  const { data: wa } = useQuery({
    queryKey: ['whatsapp-estado'],
    queryFn:  api.whatsapp.estado,
    refetchInterval: 5000,
  })

  return (
    <NavContext.Provider value={{ setActivo }}>
    <PaletaContext.Provider value={paleta}>
      <div className="min-h-screen flex flex-col" style={{ background: BG, fontFamily: "'Inter', sans-serif" }}>

        {/* ── Header sticky ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BORDR, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

          {/* Fila superior: logo + nombre + estado + volver */}
          <div className="flex items-center gap-3 px-4 md:px-8 pt-3 pb-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <FmLogo size={36} color={paleta.primario} />
              <div className="min-w-0">
                <p className="leading-none truncate"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: 15,
                    color: TXT1,
                  }}>
                  Od. Franyelis Moreno
                </p>
                <p className="text-[9px] tracking-widest mt-0.5 hidden sm:block"
                  style={{ color: TXT2, letterSpacing: '0.16em' }}>
                  ODONTÓLOGO GENERAL
                </p>
              </div>
            </div>

            {/* Estado WhatsApp */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0"
              style={{
                background: wa?.conectado ? '#F0FDF4' : '#F8FAFC',
                color:      wa?.conectado ? '#15803D' : TXT2,
                border:     `1px solid ${wa?.conectado ? '#BBF7D0' : BORDR}`,
              }}>
              {wa?.conectado
                ? <><Wifi className="w-3 h-3" /><span className="hidden sm:inline">WhatsApp activo</span>
                    {wa.bot_activo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </>
                : <><WifiOff className="w-3 h-3" /><span className="hidden sm:inline">Sin conexión</span></>
              }
            </div>

            <Link to="/" className="flex items-center gap-1.5 text-xs shrink-0 px-2.5 py-1 rounded-full transition-colors hover:bg-gray-100"
              style={{ color: TXT2 }}>
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </div>

          {/* Fila de pills de navegación — scrollable en mobile */}
          <nav className="flex items-center gap-1 px-4 md:px-8 pb-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}>
            {NAV.map(({ key, label, icon: Icon }) => {
              const isActive = activo === key
              return (
                <button
                  key={key}
                  onClick={() => setActivo(key)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0"
                  style={{
                    background:  isActive ? paleta.primario : CARD,
                    color:       isActive ? '#ffffff'       : TXT2,
                    border:      `1px solid ${isActive ? paleta.primario : BORDR}`,
                    boxShadow:   isActive ? `0 2px 8px ${paleta.primario}40` : 'none',
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              )
            })}
          </nav>
        </header>

        {/* ── Contenido ─────────────────────────────────────────────── */}
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-8">
          <div className={activo === 'inicio' ? 'w-full' : 'max-w-4xl mx-auto'}>
            {TABS[activo]}
          </div>
        </main>

        {/* ── Bottom nav móvil ──────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t"
          style={{ borderColor: BORDR, boxShadow: '0 -1px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-around px-2 py-2">
            {NAV.slice(0, 6).map(({ key, label, icon: Icon }) => {
              const isActive = activo === key
              return (
                <button key={key} onClick={() => setActivo(key)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
                  style={{ color: isActive ? paleta.primario : '#9ca3af' }}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-medium">{label.slice(0, 6)}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full" style={{ background: paleta.primario }} />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

      </div>
    </PaletaContext.Provider>
    </NavContext.Provider>
  )
}
