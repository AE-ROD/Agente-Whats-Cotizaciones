import { Link } from 'react-router-dom'
import { MessageCircle, Calendar, DollarSign, Bot, CheckCircle, Zap, ArrowRight, Phone } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#063740] to-slate-900 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#a8781a] rounded-full flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="font-semibold text-lg">Klin</span>
        </div>
        <Link
          to="/dashboard"
          className="bg-[#a8781a] hover:bg-[#8a6315] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
        >
          Ir al Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
          <Bot className="w-4 h-4 text-[#a8781a]" />
          <span>Agente IA por WhatsApp</span>
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Gestión dental inteligente<br />
          <span className="text-[#a8781a]">con cotizaciones automáticas</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          Sarah, tu recepcionista virtual de IA, atiende pacientes por WhatsApp las 24hs.
          Agenda turnos, responde preguntas y genera presupuestos en segundos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="bg-[#a8781a] hover:bg-[#8a6315] text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 justify-center transition-colors"
          >
            Abrir Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#caracteristicas"
            className="border border-white/30 hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Ver características
          </a>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Todo lo que necesitás en un solo sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<MessageCircle className="w-8 h-8" />}
            titulo="WhatsApp Integrado"
            descripcion="Recibí y respondé mensajes automáticamente via WhatsApp Cloud API. Sarah atiende a tus pacientes 24/7."
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            titulo="Turnos Automáticos"
            descripcion="Los pacientes agendan, cancelan y reprograman turnos directamente desde WhatsApp."
          />
          <FeatureCard
            icon={<DollarSign className="w-8 h-8" />}
            titulo="Cotizaciones Automáticas"
            descripcion="Presupuestos instantáneos por WhatsApp, sin esperas. Los pacientes responden ACEPTAR o RECHAZAR."
          />
          <FeatureCard
            icon={<Bot className="w-8 h-8" />}
            titulo="IA Inteligente"
            descripcion="GPT-4o entiende el contexto, consulta precios reales del catálogo y nunca inventa información."
          />
        </div>
      </section>

      {/* Pasos */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
        <div className="space-y-6">
          <Paso numero="1" titulo="El paciente escribe por WhatsApp" descripcion='Pregunta "¿cuánto sale una limpieza?" o "quiero agendar un turno".' />
          <Paso numero="2" titulo="Sarah consulta el catálogo y genera la cotización" descripcion="El agente de IA busca los precios reales, confirma con el paciente y crea el presupuesto." />
          <Paso numero="3" titulo="El paciente acepta o rechaza" descripcion='Responde "ACEPTAR" o "RECHAZAR" y el estado se actualiza en el dashboard automáticamente.' />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Phone className="w-4 h-4" />
          <span>Sistema de gestión dental — Powered by OpenAI GPT-4o + WhatsApp Cloud API</span>
        </div>
        <p>© 2026 Klin. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, titulo, descripcion }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="text-[#a8781a] mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{titulo}</h3>
      <p className="text-slate-400 text-sm">{descripcion}</p>
    </div>
  )
}

function Paso({ numero, titulo, descripcion }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 bg-[#a8781a] rounded-full flex items-center justify-center font-bold text-lg shrink-0">
        {numero}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{titulo}</h3>
        <p className="text-slate-400">{descripcion}</p>
      </div>
    </div>
  )
}
