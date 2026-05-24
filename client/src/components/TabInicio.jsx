import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePaletaCtx, useNavCtx } from '@/pages/Dashboard'
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, XAxis, YAxis,
} from 'recharts'
import {
  Users, Calendar, FileText, DollarSign, TrendingUp, Clock, Sparkles,
  Camera, Lightbulb, Target, Star, CalendarCheck, Smile, Gem, Tag,
  Video, HelpCircle, MessageSquare, Gift, BarChart2, Leaf, Award,
  Stethoscope, Heart, Smartphone, Trophy, Moon, Handshake, MapPin,
  GraduationCap, MessageCircle, Zap,
} from 'lucide-react'

// ── Colores fijos ────────────────────────────────────────────────────────────
const CARD  = '#FFFFFF'
const BORDR = '#E2E8F0'
const TXT1  = '#1E293B'
const TXT2  = '#64748B'
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

// Fecha local en YYYY-MM-DD
function fechaLocalHoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabInicio() {
  const paleta   = usePaletaCtx()
  const navCtx   = useNavCtx()
  const ideas    = useMemo(getIdeas, [])
  const proxima  = useMemo(tiempoRestante, [])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn:  api.stats.obtener,
    refetchInterval: 30000,
  })

  const hoy = fechaLocalHoy()
  const { data: turnosHoy = [] } = useQuery({
    queryKey: ['turnos-hoy', hoy],
    queryFn:  () => api.turnos.porFecha(hoy),
    refetchInterval: 30000,
  })

  const { data: contactosRecientes = [] } = useQuery({
    queryKey: ['contactos-recientes'],
    queryFn:  () => api.contactos.listar({}),
    refetchInterval: 30000,
    select: (data) => data.slice(0, 6),
  })

  const fecha = new Date().toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase()

  // Acciones rápidas — navegación directa
  const ACCIONES = [
    { label: 'Nuevo turno',      icon: Calendar,       tab: 'turnos'        },
    { label: 'Nueva cotización', icon: FileText,        tab: 'cotizaciones'  },
    { label: 'Contactos',        icon: Users,           tab: 'contactos'     },
    { label: 'Mensajes',         icon: MessageCircle,   tab: 'mensajes'      },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-5 items-start">

      {/* ══════════════════════════════════════
          COLUMNA IZQUIERDA — solo desktop
      ══════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col gap-4">

        {/* Ingresos del mes — mini card oscura */}
        <div className="rounded-2xl p-4" style={{ background: paleta.gradiente }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,.5)' }}>
            Ingresos del mes
          </p>
          <p className="text-2xl font-bold mt-1 text-white">
            ${stats ? Number(stats.resumen.ingresosMes).toFixed(0) : '—'}
            <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,.5)' }}>USD</span>
          </p>
          <div className="h-1 rounded-full mt-3" style={{ background: 'rgba(255,255,255,.18)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(stats ? Math.min((stats.resumen.ingresosMes / 500) * 100, 100) : 0, 4)}%`, background: 'rgba(255,255,255,.55)' }} />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: BORDR }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
            <Zap className="inline w-3 h-3 mr-1" />Acciones rápidas
          </p>
          <div className="space-y-1.5">
            {ACCIONES.map(({ label, icon: Icon, tab }) => (
              <button
                key={tab}
                onClick={() => navCtx?.setActivo(tab)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all text-left border"
                style={{ color: TXT1, background: '#F8FAFC', borderColor: BORDR }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${paleta.primario}0e`
                  e.currentTarget.style.borderColor = `${paleta.primario}35`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#F8FAFC'
                  e.currentTarget.style.borderColor = BORDR
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: paleta.primario }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Agenda de hoy */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: BORDR }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
            <Calendar className="inline w-3 h-3 mr-1" />Agenda de hoy
          </p>
          {turnosHoy.length === 0 ? (
            <div className="text-center py-5 text-sm" style={{ color: '#CBD5E1' }}>Sin turnos hoy</div>
          ) : (
            <div className="space-y-2.5">
              {turnosHoy.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: paleta.primario }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: TXT1 }}>
                      {t.nombre_paciente || t.numero_telefono}
                    </p>
                    <p className="text-[10px]" style={{ color: TXT2 }}>
                      {t.hora_turno} · {t.servicio || 'Consulta'}
                    </p>
                  </div>
                </div>
              ))}
              {turnosHoy.length > 5 && (
                <p className="text-[10px] text-center pt-1" style={{ color: TXT2 }}>
                  +{turnosHoy.length - 5} más
                </p>
              )}
            </div>
          )}
        </div>

      </aside>

      {/* ══════════════════════════════════════
          COLUMNA CENTRAL — siempre visible
      ══════════════════════════════════════ */}
      <div className="flex flex-col gap-5 min-w-0">

        {/* Hero banner dinámico */}
        <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden"
          style={{ background: paleta.gradiente, minHeight: 180 }}>
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="absolute top-4 right-32 w-20 h-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="absolute right-5 bottom-3 select-none pointer-events-none" style={{ opacity: 0.12 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontWeight: 700, fontSize: 72, color: '#fff', lineHeight: 1 }}>fm</span>
          </div>
          <div className="relative">
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {paleta.emoji} {paleta.saludo}
            </p>
            <h2 className="text-white mt-1 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
              Doctora Franyelis
            </h2>
            <p className="text-xs mt-1 tracking-widest" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em' }}>
              OD. FRANYELIS MORENO · ODONTÓLOGO GENERAL
            </p>
            <p className="text-xs mt-0.5 tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
              {fecha}
            </p>
            {stats && (
              <div className="flex flex-wrap gap-2 mt-5">
                <Chip icon={<Calendar className="w-3.5 h-3.5" />}>
                  {stats.resumen.turnosHoy === 0 ? 'Sin turnos hoy' : `${stats.resumen.turnosHoy} turno${stats.resumen.turnosHoy !== 1 ? 's' : ''} hoy`}
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

        {/* Stat cards 2x2 */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#E2E8F0' }} />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<DollarSign style={{ width: 18, height: 18 }} />}
              label="Ingresos del mes"
              valor={`$${Number(stats.resumen.ingresosMes).toFixed(0)}`}
              sub="USD"
              barra={65}
              destacada
              paleta={paleta}
            />
            <StatCard
              icon={<Users style={{ width: 18, height: 18 }} />}
              label="Pacientes"
              valor={stats.resumen.pacientes}
              barra={Math.min((stats.resumen.pacientes / 50) * 100, 100)}
              paleta={paleta}
            />
            <StatCard
              icon={<Calendar style={{ width: 18, height: 18 }} />}
              label="Turnos hoy"
              valor={stats.resumen.turnosHoy}
              barra={Math.min((stats.resumen.turnosHoy / 8) * 100, 100)}
              paleta={paleta}
            />
            <StatCard
              icon={<FileText style={{ width: 18, height: 18 }} />}
              label="Cot. pendientes"
              valor={stats.resumen.cotPendientes}
              barra={Math.min((stats.resumen.cotPendientes / 10) * 100, 100)}
              paleta={paleta}
            />
          </div>
        )}

        {/* AreaChart — ingresos por mes */}
        {stats && (
          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: BORDR }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${paleta.primario}18` }}>
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
                      <Area type="monotone" dataKey="monto" stroke={paleta.primario} strokeWidth={2.5}
                        fill="url(#grad-area)" dot={{ r: 3.5, fill: paleta.primario, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            }
          </div>
        )}

        {/* Mobile only: Donut + Ideas (en desktop están en col derecha) */}
        {stats && (
          <div className="lg:hidden">
            <DonutTurnos stats={stats} paleta={paleta} />
          </div>
        )}
        <div className="lg:hidden">
          <IdeasCard ideas={ideas} proxima={proxima} paleta={paleta} cantidad={4} />
        </div>

      </div>

      {/* ══════════════════════════════════════
          COLUMNA DERECHA — solo desktop
      ══════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col gap-4">

        {/* Actividad reciente — contactos */}
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: BORDR }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
            <Users className="inline w-3 h-3 mr-1" />Actividad reciente
          </p>
          {contactosRecientes.length === 0 ? (
            <div className="text-center py-5 text-sm" style={{ color: '#CBD5E1' }}>Sin pacientes aún</div>
          ) : (
            <div className="space-y-2.5">
              {contactosRecientes.map(c => (
                <div key={c.numero_telefono} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: paleta.gradiente }}>
                    {(c.nombre || c.numero_telefono).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: TXT1 }}>
                      {c.nombre || c.numero_telefono}
                    </p>
                    <p className="text-[10px]" style={{ color: TXT2 }}>
                      {c.total_mensajes} mens. · {c.total_turnos} turno{c.total_turnos !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donut de turnos */}
        {stats && <DonutTurnos stats={stats} paleta={paleta} />}

        {/* Ideas rotativas — 2 comprimidas */}
        <IdeasCard ideas={ideas} proxima={proxima} paleta={paleta} cantidad={2} />

      </aside>

    </div>
  )
}

// ── Sub-componentes compartidos ───────────────────────────────────────────────

function Chip({ icon, children }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
      {icon}{children}
    </div>
  )
}

function StatCard({ icon, label, valor, sub, barra = 0, destacada = false, paleta }) {
  const bg    = destacada ? paleta.gradiente           : CARD
  const clr   = destacada ? '#fff'                    : TXT1
  const clrS  = destacada ? 'rgba(255,255,255,0.7)'   : TXT2
  const barBg = destacada ? 'rgba(255,255,255,0.25)'  : '#EFF2F7'
  const barFg = destacada ? '#fff'                    : paleta.primario

  return (
    <div className="rounded-2xl p-4 border flex flex-col justify-between"
      style={{ background: bg, borderColor: destacada ? 'transparent' : BORDR, minHeight: 110, boxShadow: destacada ? `0 4px 16px ${paleta.primario}40` : 'none' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: clrS, letterSpacing: '0.08em' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: destacada ? 'rgba(255,255,255,0.2)' : `${paleta.primario}15` }}>
          <span style={{ color: destacada ? '#fff' : paleta.primario }}>{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none mt-2" style={{ color: clr }}>
          {valor}{sub && <span className="text-sm font-normal ml-1" style={{ color: clrS }}>{sub}</span>}
        </p>
        <div className="mt-3 h-1.5 rounded-full" style={{ background: barBg }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ background: barFg, width: `${Math.max(barra, 4)}%` }} />
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="h-28 flex items-center justify-center text-sm" style={{ color: '#CBD5E1' }}>{label}</div>
  )
}

function DonutTurnos({ stats, paleta }) {
  return (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: BORDR }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${paleta.primario}18` }}>
          <Clock className="w-3.5 h-3.5" style={{ color: paleta.primario }} />
        </div>
        <span className="font-semibold text-sm" style={{ color: TXT1 }}>Turnos</span>
      </div>
      {stats.turnosPorEstado.length === 0 ? (
        <EmptyChart label="Sin datos" />
      ) : (
        <>
          <div style={{ height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.turnosPorEstado} dataKey="cantidad" nameKey="estado"
                  cx="50%" cy="50%" innerRadius={26} outerRadius={46} paddingAngle={3}>
                  {stats.turnosPorEstado.map((_, i) => (
                    <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, ESTADOS[n] || n]}
                  contentStyle={{ borderRadius: 10, border: `1px solid ${BORDR}`, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {stats.turnosPorEstado.map((t, i) => (
              <div key={t.estado} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLS[i % PIE_COLS.length] }} />
                  <span style={{ color: TXT2 }} className="capitalize">{ESTADOS[t.estado] || t.estado}</span>
                </div>
                <span className="font-semibold" style={{ color: TXT1 }}>{t.cantidad}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function IdeasCard({ ideas, proxima, paleta, cantidad = 4 }) {
  const lista = ideas.slice(0, cantidad)
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BORDR }}>
      <div className="px-4 py-2.5 flex items-center justify-between border-b"
        style={{ borderColor: BORDR, background: `${paleta.primario}0f` }}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: paleta.primario }} />
          <span className="font-semibold text-xs" style={{ color: TXT1 }}>Ideas de hoy</span>
        </div>
        <span className="text-[10px]" style={{ color: TXT2 }}>En {proxima}</span>
      </div>
      <div className="divide-y" style={{ borderColor: BORDR }}>
        {lista.map((idea, i) => {
          const IdeaIcon = idea.icon
          return (
            <div key={i} className="flex gap-2.5 p-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${paleta.primario}15` }}>
                <IdeaIcon style={{ color: paleta.primario, width: 14, height: 14 }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs" style={{ color: TXT1 }}>{idea.titulo}</p>
                <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: TXT2 }}>{idea.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
      {cantidad >= 4 && (
        <div className="px-4 py-2 text-center text-[10px]"
          style={{ color: '#9ca3af', borderTop: `1px solid ${BORDR}`, background: '#FAFAFA' }}>
          ✨ Rotan cada 6 horas · @franyelismorenoodonto
        </div>
      )}
    </div>
  )
}
