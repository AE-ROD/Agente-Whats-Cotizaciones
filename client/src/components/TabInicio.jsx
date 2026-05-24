import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePaletaCtx } from '@/pages/Dashboard'
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

// ── Colores fijos ────────────────────────────────────────────────────────────
const CARD  = '#FFFFFF'
const BORDR = '#E2E8F0'
const TXT1  = '#1E293B'
const TXT2  = '#64748B'

// Tonos del donut de turnos (grises azulados fijos)
const PIE_COLS = ['#6B7FC4', '#94A3B8', '#CBD5E1', '#E2E8F0']
const ESTADOS  = { confirmado: 'Confirmado', pendiente: 'Pendiente', completado: 'Completado', cancelado: 'Cancelado' }

// ── Ideas rotativas ──────────────────────────────────────────────────────────
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

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabInicio() {
  const paleta = usePaletaCtx()
  const ideas   = useMemo(getIdeas, [])
  const proxima = useMemo(tiempoRestante, [])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn:  api.stats.obtener,
    refetchInterval: 30000,
  })

  const fecha = new Date().toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase()

  return (
    <div className="space-y-5">

      {/* ── Hero banner dinámico ─────────────────────────────────────── */}
      <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden"
        style={{ background: paleta.gradiente, minHeight: 180 }}>

        {/* Círculos decorativos */}
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute top-4 right-32 w-20 h-20 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }} />

        {/* Logo fm fantasma */}
        <div className="absolute right-5 bottom-3 select-none pointer-events-none"
          style={{ opacity: 0.12 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 72,
            color: '#fff',
            lineHeight: 1,
          }}>fm</span>
        </div>

        {/* Contenido */}
        <div className="relative">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {paleta.emoji} {paleta.saludo}
          </p>
          <h2 className="text-white mt-1 leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 'clamp(24px, 4vw, 34px)',
            }}>
            Doctora Franyelis
          </h2>
          <p className="text-xs mt-1 tracking-widest" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em' }}>
            OD. FRANYELIS MORENO · ODONTÓLOGO GENERAL
          </p>
          <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
            {fecha}
          </p>

          {/* Chips de info */}
          {stats && (
            <div className="flex flex-wrap gap-2 mt-5">
              <Chip icon={<Calendar className="w-3.5 h-3.5" />}>
                {stats.resumen.turnosHoy === 0
                  ? 'Sin turnos hoy'
                  : `${stats.resumen.turnosHoy} turno${stats.resumen.turnosHoy !== 1 ? 's' : ''} hoy`}
              </Chip>
              {stats.resumen.cotPendientes > 0 && (
                <Chip icon={<FileText className="w-3.5 h-3.5" />}>
                  {stats.resumen.cotPendientes} pendiente{stats.resumen.cotPendientes !== 1 ? 's' : ''}
                </Chip>
              )}
              <Chip icon={<Users className="w-3.5 h-3.5" />}>
                {stats.resumen.pacientes} paciente{stats.resumen.pacientes !== 1 ? 's' : ''}
              </Chip>
            </div>
          )}
        </div>
      </div>

      {/* ── 4 Stat cards ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#E2E8F0' }} />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Ingresos — card destacada con color del momento */}
          <StatCard
            icon={<DollarSign className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
            label="Ingresos del mes"
            valor={`$${Number(stats.resumen.ingresosMes).toFixed(0)}`}
            sub="USD"
            barra={65}
            destacada
            paleta={paleta}
          />
          <StatCard
            icon={<Users className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
            label="Pacientes"
            valor={stats.resumen.pacientes}
            barra={Math.min((stats.resumen.pacientes / 50) * 100, 100)}
            paleta={paleta}
          />
          <StatCard
            icon={<Calendar className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
            label="Turnos hoy"
            valor={stats.resumen.turnosHoy}
            barra={Math.min((stats.resumen.turnosHoy / 8) * 100, 100)}
            paleta={paleta}
          />
          <StatCard
            icon={<FileText className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
            label="Cot. pendientes"
            valor={stats.resumen.cotPendientes}
            barra={Math.min((stats.resumen.cotPendientes / 10) * 100, 100)}
            paleta={paleta}
          />
        </div>
      )}

      {/* ── Gráficos ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* AreaChart ingresos */}
          <div className="md:col-span-2 bg-white rounded-2xl p-5 border" style={{ borderColor: BORDR }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${paleta.primario}18` }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: paleta.primario }} />
              </div>
              <span className="font-semibold text-sm" style={{ color: TXT1 }}>Ingresos por mes (USD)</span>
            </div>

            {stats.cotPorMes.length === 0
              ? <EmptyChart label="Sin datos aún" />
              : <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.cotPorMes} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={paleta.primario} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={paleta.primario} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: TXT2 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: TXT2 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip
                        formatter={(v) => [`$${v}`, 'USD']}
                        contentStyle={{ borderRadius: 10, border: `1px solid ${BORDR}`, fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="monto"
                        stroke={paleta.primario}
                        strokeWidth={2.5}
                        fill="url(#grad-area)"
                        dot={{ r: 3.5, fill: paleta.primario, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            }
          </div>

          {/* PieChart donut turnos */}
          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: BORDR }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${paleta.primario}18` }}>
                <Clock className="w-3.5 h-3.5" style={{ color: paleta.primario }} />
              </div>
              <span className="font-semibold text-sm" style={{ color: TXT1 }}>Turnos</span>
            </div>

            {stats.turnosPorEstado.length === 0
              ? <EmptyChart label="Sin datos" />
              : <>
                  <div style={{ height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.turnosPorEstado}
                          dataKey="cantidad"
                          nameKey="estado"
                          cx="50%" cy="50%"
                          innerRadius={28} outerRadius={50}
                          paddingAngle={3}
                        >
                          {stats.turnosPorEstado.map((_, i) => (
                            <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [v, ESTADOS[n] || n]}
                          contentStyle={{ borderRadius: 10, border: `1px solid ${BORDR}`, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    {stats.turnosPorEstado.map((t, i) => (
                      <div key={t.estado} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLS[i % PIE_COLS.length] }} />
                          <span style={{ color: TXT2 }} className="capitalize">{ESTADOS[t.estado] || t.estado}</span>
                        </div>
                        <span className="font-semibold" style={{ color: TXT1 }}>{t.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </>
            }
          </div>
        </div>
      )}

      {/* ── Ideas rotativas ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BORDR }}>
        {/* Header con color del momento */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b"
          style={{ borderColor: BORDR, background: `${paleta.primario}0f` }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: paleta.primario }} />
            <span className="font-semibold text-sm" style={{ color: TXT1 }}>Ideas de contenido para hoy</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: TXT2 }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: paleta.primario }} />
            En {proxima}
          </div>
        </div>

        {/* Grid 2x2 de ideas */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {ideas.map((idea, i) => {
            const IdeaIcon = idea.icon
            return (
              <div key={i} className="flex gap-3 p-4"
                style={{
                  borderBottom: i < 2 ? `1px solid ${BORDR}` : 'none',
                  borderRight:  i % 2 === 0 ? `1px solid ${BORDR}` : 'none',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${paleta.primario}15` }}>
                  <IdeaIcon style={{ color: paleta.primario, width: 18, height: 18 }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: TXT1 }}>{idea.titulo}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: TXT2 }}>{idea.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-2.5 text-center text-xs"
          style={{ color: '#9ca3af', borderTop: `1px solid ${BORDR}`, background: '#FAFAFA' }}>
          ✨ Rotan cada 6 horas · @franyelismorenoodonto
        </div>
      </div>

    </div>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Chip({ icon, children }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
      {icon}
      {children}
    </div>
  )
}

function StatCard({ icon, label, valor, sub, barra = 0, destacada = false, paleta }) {
  const bg    = destacada ? paleta.gradiente : CARD
  const clr   = destacada ? '#fff'           : TXT1
  const clrS  = destacada ? 'rgba(255,255,255,0.7)' : TXT2
  const barBg = destacada ? 'rgba(255,255,255,0.25)' : '#EFF2F7'
  const barFg = destacada ? '#fff'                   : paleta.primario

  return (
    <div className="rounded-2xl p-4 border flex flex-col justify-between"
      style={{
        background:  bg,
        borderColor: destacada ? 'transparent' : BORDR,
        minHeight:   110,
        boxShadow:   destacada ? `0 4px 16px ${paleta.primario}40` : 'none',
      }}>
      {/* Icono + label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: clrS, letterSpacing: '0.08em' }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: destacada ? 'rgba(255,255,255,0.2)' : `${paleta.primario}15` }}>
          <span style={{ color: destacada ? '#fff' : paleta.primario }}>{icon}</span>
        </div>
      </div>

      {/* Número */}
      <div>
        <p className="text-2xl font-bold leading-none mt-2" style={{ color: clr }}>
          {valor}
          {sub && <span className="text-sm font-normal ml-1" style={{ color: clrS }}>{sub}</span>}
        </p>
        {/* Barra de progreso */}
        <div className="mt-3 h-1.5 rounded-full" style={{ background: barBg }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ background: barFg, width: `${Math.max(barra, 4)}%` }} />
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="h-36 flex items-center justify-center text-sm" style={{ color: '#CBD5E1' }}>
      {label}
    </div>
  )
}
