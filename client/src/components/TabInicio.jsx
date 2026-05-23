import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, XAxis, YAxis,
} from 'recharts'
import {
  Users, Calendar, FileText, DollarSign, TrendingUp, Clock, Sparkles,
  Camera, Lightbulb, Target, Star, CalendarCheck, Smile, Gem, Tag,
  Video, HelpCircle, MessageSquare, Gift, BarChart2, Leaf, Award,
  Stethoscope, Heart, Smartphone, Trophy, Moon, Handshake, MapPin, GraduationCap,
} from 'lucide-react'

const SAGE     = '#5a8a6e'
const SAGE_L   = '#edf5f0'
const BLUSH    = '#c97b84'
const BLUSH_L  = '#fdf0f2'
const GRAY_T   = '#1f2937'
const GRAY_M   = '#6b7280'
const BORDER   = '#e5eee8'
const PIE_COLS = [SAGE, '#7ab892', BLUSH, '#e8aab0']
const ESTADOS  = { confirmado: 'Confirmado', pendiente: 'Pendiente', completado: 'Completado', cancelado: 'Cancelado' }

const IDEAS = [
  { icon: Camera,        titulo: 'Antes y después',          desc: 'Resultados reales generan más confianza que cualquier publicidad' },
  { icon: Lightbulb,     titulo: 'Tip dental del día',        desc: 'Un consejo de higiene oral educa y fideliza a tu audiencia' },
  { icon: Target,        titulo: 'Historia en Instagram',     desc: 'Muestra un día en tu consultorio con stories auténticas' },
  { icon: Star,          titulo: 'Testimonio de paciente',    desc: 'Pide a un paciente satisfecho que cuente su experiencia' },
  { icon: CalendarCheck, titulo: 'Recordatorio de control',   desc: 'Invita a agendar la limpieza semestral por WhatsApp' },
  { icon: Smile,         titulo: 'Dato curioso dental',       desc: '¿Sabías que...? Aumenta el engagement con contenido educativo' },
  { icon: Gem,           titulo: 'Blanqueamiento en oferta',  desc: 'Promo por tiempo limitado para generar urgencia' },
  { icon: Tag,           titulo: 'Lista de precios',          desc: 'Publicar tu tarifa genera confianza y transparencia' },
  { icon: Video,         titulo: 'Reel del consultorio',      desc: 'Muestra las instalaciones para que el paciente llegue tranquilo' },
  { icon: HelpCircle,    titulo: 'FAQ dental',                desc: 'Responde las dudas más comunes sobre tus tratamientos' },
  { icon: Star,          titulo: 'Reseña en Google',          desc: 'Pide a tus últimos 3 pacientes que dejen 5 estrellas' },
  { icon: MessageSquare, titulo: 'Encuesta en stories',       desc: '¿Qué tratamiento quieren conocer más? Deja que elijan' },
  { icon: Gift,          titulo: 'Sorteo de consulta',        desc: 'Sortea una consulta gratis para ganar nuevos seguidores' },
  { icon: BarChart2,     titulo: 'Estadística de salud oral', desc: 'Un dato impactante sobre salud dental en la región' },
  { icon: Leaf,          titulo: 'Contenido de temporada',    desc: 'Adapta tu post a una fecha especial del mes' },
  { icon: Award,         titulo: 'Sobre tu trayectoria',      desc: 'Cuéntales tu formación y por qué elegiste odontología' },
  { icon: Stethoscope,   titulo: 'Explica un procedimiento',  desc: 'Desmitifica un tratamiento para reducir el miedo' },
  { icon: Heart,         titulo: 'Sonrisa y autoestima',      desc: 'Conecta la salud oral con la confianza y bienestar' },
  { icon: Smartphone,    titulo: 'Llamada a la acción',       desc: '¡Agendá tu cita! Post directo con tu WhatsApp' },
  { icon: Trophy,        titulo: 'Logro o certificación',     desc: 'Comparte si completaste algún curso o capacitación' },
  { icon: Moon,          titulo: 'Frase motivadora',          desc: 'Una frase inspiradora sobre la salud y la confianza personal' },
  { icon: Handshake,     titulo: 'Colaboración local',        desc: 'Alianza con un negocio local para promoción cruzada' },
  { icon: MapPin,        titulo: 'Cómo llegar',               desc: 'Post con tu dirección, horarios y forma de contacto' },
  { icon: GraduationCap, titulo: 'Salud dental en niños',     desc: 'Tips para padres — amplía tu audiencia a familias' },
]

function getIdeas() {
  const p = Math.floor(Date.now() / (6 * 60 * 60 * 1000))
  return Array.from({ length: 4 }, (_, i) => IDEAS[(p * 4 + i) % IDEAS.length])
}

function tiempoRestante() {
  const ms = 6 * 60 * 60 * 1000
  const r  = ms - (Date.now() % ms)
  return `${Math.floor(r / 3600000)}h ${Math.floor((r % 3600000) / 60000)}m`
}

function useSaludo() {
  return useMemo(() => {
    const h = new Date().getHours()
    if (h >= 6  && h < 13) return { texto: 'Buenos días',   emoji: '⛅' }
    if (h >= 13 && h < 20) return { texto: 'Buenas tardes', emoji: '☀️' }
    return                        { texto: 'Buenas noches', emoji: '🌙' }
  }, [])
}

export default function TabInicio() {
  const { texto: saludo, emoji } = useSaludo()
  const ideas   = useMemo(getIdeas, [])
  const proxima = useMemo(tiempoRestante, [])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn:  api.stats.obtener,
    refetchInterval: 30000,
  })

  return (
    <div className="space-y-6">

      {/* ── Saludo ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Card principal */}
        <div className="md:col-span-2 rounded-2xl p-6 relative overflow-hidden" style={{ background: SAGE, minHeight: 160 }}>
          {/* Círculos decorativos */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10 bg-white" />

          <div className="relative">
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{emoji} {saludo}</span>
            <h2 className="text-white text-2xl md:text-3xl font-semibold mt-1 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}>
              Doctora Franyelis
            </h2>
            <p className="text-xs mt-1.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.14em' }}>
              {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </p>
          </div>

          {stats && (
            <div className="relative mt-5 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <Calendar className="w-3.5 h-3.5" />
                {stats.resumen.turnosHoy === 0 ? 'Sin turnos hoy' : `${stats.resumen.turnosHoy} turno${stats.resumen.turnosHoy !== 1 ? 's' : ''} hoy`}
              </div>
              {stats.resumen.cotPendientes > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  <FileText className="w-3.5 h-3.5" />
                  {stats.resumen.cotPendientes} pendiente{stats.resumen.cotPendientes !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card ingresos destacado */}
        <div className="rounded-2xl p-6 flex flex-col justify-between border" style={{ background: '#fff', borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: GRAY_M, letterSpacing: '0.1em' }}>
              Ingresos del mes
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BLUSH_L }}>
              <DollarSign className="w-4 h-4" style={{ color: BLUSH }} />
            </div>
          </div>
          {stats ? (
            <>
              <div>
                <p className="text-3xl font-bold mt-4" style={{ color: GRAY_T }}>
                  ${Number(stats.resumen.ingresosMes).toFixed(0)}
                  <span className="text-sm font-normal ml-1" style={{ color: GRAY_M }}>USD</span>
                </p>
                <div className="mt-3 h-1.5 rounded-full" style={{ background: '#f3f4f6' }}>
                  <div className="h-full rounded-full" style={{ background: BLUSH, width: '65%' }} />
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: GRAY_M }}>Cotizaciones aceptadas</p>
            </>
          ) : (
            <div className="h-16 animate-pulse bg-gray-100 rounded-xl mt-4" />
          )}
        </div>
      </div>

      {/* ── Stats secundarios ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" style={{ borderColor: BORDER }} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-3 gap-3">
          <MiniStat icon={<Users />}    label="Pacientes"       valor={stats.resumen.pacientes}     color={SAGE}  bg={SAGE_L} />
          <MiniStat icon={<Calendar />} label="Turnos hoy"      valor={stats.resumen.turnosHoy}     color={BLUSH} bg={BLUSH_L} />
          <MiniStat icon={<FileText />} label="Cot. pendientes" valor={stats.resumen.cotPendientes} color={SAGE}  bg={SAGE_L} />
        </div>
      )}

      {/* ── Gráficos ──────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-2xl p-5 border" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: SAGE_L }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: SAGE }} />
              </div>
              <span className="font-semibold text-sm" style={{ color: GRAY_T }}>Ingresos por mes (USD)</span>
            </div>
            {stats.cotPorMes.length === 0
              ? <div className="h-36 flex items-center justify-center text-gray-300 text-sm">Sin datos aún</div>
              : <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.cotPorMes} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={SAGE} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={SAGE} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: GRAY_M }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: GRAY_M }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip formatter={(v) => [`$${v}`, 'USD']}
                        contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12 }} />
                      <Area type="monotone" dataKey="monto" stroke={SAGE} strokeWidth={2.5}
                        fill="url(#gs)" dot={{ r: 3.5, fill: SAGE, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            }
          </div>

          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BLUSH_L }}>
                <Clock className="w-3.5 h-3.5" style={{ color: BLUSH }} />
              </div>
              <span className="font-semibold text-sm" style={{ color: GRAY_T }}>Turnos</span>
            </div>
            {stats.turnosPorEstado.length === 0
              ? <div className="h-36 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
              : <>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.turnosPorEstado} dataKey="cantidad" nameKey="estado"
                          cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3}>
                          {stats.turnosPorEstado.map((_, i) => <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, ESTADOS[n] || n]}
                          contentStyle={{ borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {stats.turnosPorEstado.map((t, i) => (
                      <div key={t.estado} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLS[i % PIE_COLS.length] }} />
                          <span style={{ color: GRAY_M }} className="capitalize">{ESTADOS[t.estado] || t.estado}</span>
                        </div>
                        <span className="font-semibold" style={{ color: GRAY_T }}>{t.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>
        </div>
      )}

      {/* ── Ideas rotativas ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: BORDER, background: SAGE_L }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: SAGE }} />
            <span className="font-semibold text-sm" style={{ color: GRAY_T }}>Ideas de contenido para hoy</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: GRAY_M }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: SAGE }} />
            En {proxima}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {ideas.map((idea, i) => {
            const IdeaIcon = idea.icon
            const isEven   = i % 2 === 0
            return (
              <div key={i} className="flex gap-3 p-4"
                style={{ borderBottom: i < ideas.length - (ideas.length % 2 === 0 ? 2 : 1) ? `1px solid ${BORDER}` : 'none',
                         borderRight: i % 2 === 0 && i < ideas.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isEven ? SAGE_L : BLUSH_L }}>
                  <IdeaIcon className="w-4.5 h-4.5" style={{ color: isEven ? SAGE : BLUSH, width: 18, height: 18 }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: GRAY_T }}>{idea.titulo}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: GRAY_M }}>{idea.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-2.5 text-center text-xs" style={{ color: '#9ca3af', borderTop: `1px solid ${BORDER}`, background: '#fafafa' }}>
          ✨ Rotan cada 6 horas · @franyelismorenoodonto
        </div>
      </div>

    </div>
  )
}

function MiniStat({ icon, label, valor, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-4 border flex items-center gap-3" style={{ borderColor: '#e5eee8' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <span style={{ color }} className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none" style={{ color: '#1f2937' }}>{valor}</p>
        <p className="text-xs mt-1 truncate" style={{ color: '#9ca3af' }}>{label}</p>
      </div>
    </div>
  )
}
