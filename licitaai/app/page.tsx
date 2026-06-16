import {
  Search, Sparkles, Bell, Check, ArrowRight,
  ShieldCheck, Clock, Target,
} from 'lucide-react'

export const metadata = {
  title: 'LicitaAI — Tu Director de Licitaciones Virtual',
  description:
    'Encuentra, analiza y gana licitaciones de gobierno en LATAM. LicitaAI rastrea los portales, calcula con IA qué tan compatible es cada licitación con tu empresa y te avisa por WhatsApp.',
}

const STEPS = [
  {
    icon: Search,
    title: '1. Rastreamos por ti',
    text: 'Revisamos los portales de compras públicas 24/7 y traemos todas las licitaciones nuevas, sin que muevas un dedo.',
  },
  {
    icon: Sparkles,
    title: '2. La IA calcula tu Fit Score',
    text: 'Cada licitación se compara con el perfil de tu empresa y recibe un puntaje de compatibilidad del 0 al 100%.',
  },
  {
    icon: Bell,
    title: '3. Te avisamos al instante',
    text: 'Las oportunidades de alta compatibilidad llegan a tu dashboard y a tu WhatsApp antes de que se venza el plazo.',
  },
]

const FEATURES = [
  { icon: Target, title: 'Solo lo relevante', text: 'Filtra por sector, estado, monto y palabras clave. Nada de ruido: solo licitaciones que tu empresa puede ganar.' },
  { icon: Clock, title: 'Ahorra horas cada día', text: 'Deja de revisar portales manualmente. Tu Director de Licitaciones Virtual trabaja mientras tú atiendes tu negocio.' },
  { icon: ShieldCheck, title: 'Decisiones con datos', text: 'El Fit Score te dice dónde vale la pena invertir tiempo en una propuesta, antes de gastar recursos.' },
]

const PLANS = [
  { id: 'starter', name: 'Starter', price: 29, features: ['20 análisis de compatibilidad / mes', '15 alertas al mes', 'Dashboard web', 'Filtros personalizados'], highlight: false },
  { id: 'pro', name: 'Pro', price: 79, features: ['100 análisis de compatibilidad / mes', '60 alertas al mes', 'Alertas por WhatsApp', 'Soporte prioritario'], highlight: true },
  { id: 'business', name: 'Business', price: 179, features: ['Análisis ilimitados', 'Alertas ilimitadas', 'Múltiples usuarios', 'Análisis avanzado de PDFs'], highlight: false },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">🏛 LicitaAI</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/login" className="text-slate-300 hover:text-white text-sm px-3 py-2 transition-colors">
              Iniciar sesión
            </a>
            <a href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Empezar gratis
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-slate-950 to-slate-950" />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <span className="inline-block text-blue-400 text-sm font-medium bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            Licitaciones de gobierno en LATAM
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Tu empresa nunca más<br />
            <span className="text-blue-400">pierde una licitación</span> de gobierno
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            LicitaAI es tu Director de Licitaciones Virtual: rastrea los portales públicos,
            calcula con IA qué tan compatible es cada oportunidad con tu empresa y te avisa
            antes de que se venza el plazo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-7 py-3.5 rounded-lg transition-colors inline-flex items-center justify-center gap-2">
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/login" className="border border-slate-700 hover:border-slate-500 hover:bg-slate-900 text-white font-medium px-7 py-3.5 rounded-lg transition-colors">
              Ya tengo cuenta
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-6">Sin tarjeta de crédito · Configúralo en 2 minutos</p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Cómo funciona</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          Tres pasos. Tú defines tu perfil una vez, y LicitaAI hace el resto todos los días.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                <Icon className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-10">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="h-7 w-7 text-blue-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRECIOS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Planes simples</h2>
        <p className="text-slate-400 text-center mb-14">
          Menos que un empleado de medio tiempo. Cancela cuando quieras.
        </p>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-7 border ${
                plan.highlight
                  ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500/40 relative'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Más popular
                </span>
              )}
              <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-slate-400 text-sm"> USD / mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className={`block text-center font-medium px-5 py-3 rounded-lg transition-colors ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-white'
                }`}
              >
                Empezar con {plan.name}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para no perder otra licitación?</h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">
            Crea tu cuenta gratis y configura tu perfil en menos de 2 minutos.
          </p>
          <a href="/signup" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-lg transition-colors inline-flex items-center gap-2">
            Empezar gratis <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-300">🏛 LicitaAI</span>
          <span>© {new Date().getFullYear()} LicitaAI. Licitaciones de gobierno para PYMES en LATAM.</span>
        </div>
      </footer>
    </div>
  )
}
