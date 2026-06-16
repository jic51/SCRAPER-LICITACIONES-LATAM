import {
  Search, Sparkles, Bell, Check, ArrowRight,
  TrendingUp, AlertTriangle, Eye, Clock, MapPin, CheckCircle2,
} from 'lucide-react'
import RotatingTenderCard from '@/components/landing/RotatingTenderCard'

export const metadata = {
  title: 'LicitaAI — Tu Director de Licitaciones Virtual',
  description:
    'Encuentra, analiza y gana licitaciones de gobierno en América Latina. LicitaAI rastrea los portales públicos, calcula con IA qué tan compatible es cada licitación con tu empresa y te avisa por WhatsApp.',
}

const STATS = [
  { num: '13%', label: 'del PIB se gasta en compras públicas en países de la OCDE' },
  { num: 'US$9.5 B', label: 'se gastan al año en contrataciones públicas a nivel mundial' },
  { num: '<1%', label: 'de los proveedores concentra el 50% del presupuesto público (México)' },
  { num: '24/7', label: 'se publican nuevas licitaciones en los portales de LATAM' },
]

const PROBLEMS = [
  { icon: Eye, title: 'No las ves a tiempo', text: 'Las licitaciones se publican repartidas en decenas de portales. Para cuando te enteras, el plazo ya casi venció.' },
  { icon: Clock, title: 'Revisar a mano agota', text: 'Buscar manualmente cada día consume horas que tu equipo necesita para preparar propuestas y atender clientes.' },
  { icon: AlertTriangle, title: 'El mercado está concentrado', text: 'Pocos proveedores se quedan con la mayor parte del presupuesto. No por falta de competencia: por falta de información a tiempo.' },
]

const STEPS = [
  { icon: Search, title: '1. Rastreamos por ti', text: 'Revisamos los portales de compras públicas 24/7 y traemos todas las licitaciones nuevas, sin que muevas un dedo.' },
  { icon: Sparkles, title: '2. La IA calcula tu Fit Score', text: 'Cada licitación se compara con el perfil de tu empresa y recibe un puntaje de compatibilidad del 0 al 100%.' },
  { icon: Bell, title: '3. Te avisamos al instante', text: 'Las oportunidades de alta compatibilidad llegan a tu dashboard y a tu WhatsApp antes de que se venza el plazo.' },
]

const SCIENCE = [
  { num: '10–15%', title: 'del PIB son compras de gobierno', text: 'Las compras públicas representan entre el 10% y el 15% del PIB mundial, y aún más en economías en desarrollo. Es el cliente más grande de tu país.', source: 'Banco Mundial / OCDE' },
  { num: 'US$9.5 B', title: 'de gasto anual en el mundo', text: 'Los gobiernos gastan cerca de 9.5 billones de dólares al año en contrataciones. Un mercado enorme y constante, abierto a quien sepa dónde buscar.', source: 'ITC – OIT' },
  { num: '50%', title: 'del presupuesto se concentra', text: 'En México, menos del 1% de los proveedores registrados concentra el 50% del presupuesto asignado. La barrera no es la capacidad: es el acceso a la información.', source: 'Análisis de datos históricos de CompraNet' },
]

const COUNTRIES = [
  { country: 'México', portal: 'CompraNet · Compras MX', status: 'available' as const },
  { country: 'Colombia', portal: 'SECOP II · Colombia Compra', status: 'soon' as const },
  { country: 'Chile', portal: 'ChileCompra · Mercado Público', status: 'soon' as const },
]

const FAQ = [
  { q: '¿De qué países son las licitaciones?', a: 'Hoy cubrimos México (CompraNet y Compras MX). Colombia (SECOP II) y Chile (ChileCompra) vienen en camino, y seguiremos sumando países de América Latina.' },
  { q: '¿Cómo se calcula el Fit Score?', a: 'Comparamos cada licitación con el perfil de tu empresa —sector, ubicación, rango de monto y palabras clave— usando IA para estimar qué tan compatible es contigo, en una escala del 0 al 100%.' },
  { q: '¿Necesito conocimientos técnicos?', a: 'No. Configuras tu perfil una sola vez en un par de minutos y recibes las oportunidades ya filtradas en tu dashboard y por WhatsApp.' },
  { q: '¿Las alertas llegan por WhatsApp?', a: 'Sí. En los planes Pro y Business te avisamos por WhatsApp en cuanto aparece una licitación de alta compatibilidad.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Claro. No hay contratos ni permanencia: cancelas con un clic cuando quieras.' },
]

const PLANS = [
  { id: 'starter', name: 'Starter', price: 29, features: ['20 análisis de compatibilidad / mes', '15 alertas al mes', 'Dashboard web', 'Filtros personalizados'], highlight: false },
  { id: 'pro', name: 'Pro', price: 79, features: ['100 análisis de compatibilidad / mes', '60 alertas al mes', 'Alertas por WhatsApp', 'Soporte prioritario'], highlight: true },
  { id: 'business', name: 'Business', price: 179, features: ['Análisis ilimitados', 'Alertas ilimitadas', 'Múltiples usuarios', 'Análisis avanzado de PDFs'], highlight: false },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">🏛 LicitaAI</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#cobertura" className="text-slate-600 hover:text-slate-900 text-sm px-3 py-2 transition-colors hidden sm:inline">Cobertura</a>
            <a href="#precios" className="text-slate-600 hover:text-slate-900 text-sm px-3 py-2 transition-colors hidden sm:inline">Precios</a>
            <a href="/login" className="text-slate-600 hover:text-slate-900 text-sm px-3 py-2 transition-colors">Iniciar sesión</a>
            <a href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Empezar gratis</a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-blue-700 text-sm font-medium bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
              Licitaciones de gobierno en América Latina
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
              Tu empresa nunca más<br />
              <span className="text-blue-600">pierde una licitación</span> de gobierno
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mb-8">
              LicitaAI es tu Director de Licitaciones Virtual: rastrea los portales públicos,
              calcula con IA qué tan compatible es cada oportunidad con tu empresa y te avisa
              antes de que se venza el plazo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 py-3.5 rounded-lg transition-colors inline-flex items-center justify-center gap-2">
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/login" className="border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-900 font-medium px-7 py-3.5 rounded-lg transition-colors text-center">
                Ya tengo cuenta
              </a>
            </div>
            <p className="text-slate-500 text-sm mt-6">Sin tarjeta de crédito · Configúralo en 2 minutos</p>
          </div>

          {/* MOCKUP: tarjeta de licitación con Fit Score (rota entre países) */}
          <RotatingTenderCard />
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{s.num}</div>
              <p className="text-slate-600 text-sm leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EL PROBLEMA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-14">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">El problema</span>
          <h2 className="text-3xl font-bold mt-3 mb-4">La oportunidad existe. El problema es encontrarla a tiempo.</h2>
          <p className="text-slate-600 text-lg">
            El gobierno es el comprador más grande de cada país de LATAM. Pero la mayoría de las
            PYMES no pierden licitaciones por falta de capacidad, sino porque nunca se enteran de
            las que sí podían ganar.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PROBLEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-5">
                <Icon className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Cómo funciona</h2>
          <p className="text-slate-600 text-center mb-14 max-w-xl mx-auto">
            Tres pasos. Tú defines tu perfil una vez, y LicitaAI hace el resto todos los días.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOS DATOS DETRÁS DE LA ESTRATEGIA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-14">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Los datos detrás de la estrategia
          </span>
          <h2 className="text-3xl font-bold mt-3 mb-4">No es una corazonada. Es el mercado más grande y constante que existe.</h2>
          <p className="text-slate-600 text-lg">
            Las cifras del gasto público explican por qué vale la pena tener un sistema dedicado
            a no perder ni una sola oportunidad.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {SCIENCE.map((c) => (
            <div key={c.title} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
              <div className="text-4xl font-bold text-blue-600 mb-3">{c.num}</div>
              <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">{c.text}</p>
              <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">Fuente: {c.source}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-8 max-w-3xl">
          Datos basados en estimaciones de la OCDE y el Banco Mundial sobre el peso de las compras
          públicas en el PIB, el reporte de gasto global del Centro Internacional de Formación de la
          OIT, y análisis de datos históricos de CompraNet sobre la concentración de proveedores en
          México.
        </p>
      </section>

      {/* COBERTURA POR PAÍS */}
      <section id="cobertura" className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Cobertura
            </span>
            <h2 className="text-3xl font-bold mt-3 mb-4">Empezamos en México. Vamos por toda LATAM.</h2>
            <p className="text-slate-300 text-lg">
              Cada país tiene su propio portal de compras públicas. Los vamos integrando uno por uno
              para que tú solo tengas un lugar donde mirar.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {COUNTRIES.map((c) => (
              <div
                key={c.country}
                className={`rounded-2xl p-6 border ${
                  c.status === 'available'
                    ? 'bg-slate-800 border-green-500/40'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{c.country}</h3>
                  {c.status === 'available' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 rounded-full px-3 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-700 rounded-full px-3 py-1">Próximamente</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{c.portal}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm mt-8">
            Y muy pronto: <span className="text-slate-200">Perú, Argentina</span> y más países de la región.
            ¿Quieres que avisemos cuando lleguemos al tuyo?{' '}
            <a href="/signup" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Déjanos tu correo</a>.
          </p>
        </div>
      </section>

      {/* NOTA DEL FUNDADOR */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-10 sm:p-12">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">Por qué construimos esto</span>
          <blockquote className="text-xl sm:text-2xl text-slate-800 font-medium leading-relaxed mt-5">
            “Hablé con decenas de dueños de pequeñas empresas y casi todos me dijeron lo mismo: <span className="text-blue-700">‘sé que hay contratos de gobierno para mí, pero no tengo tiempo de buscarlos’</span>. El comprador más grande de la región estaba fuera de su alcance —no por falta de capacidad, sino de tiempo y de información. LicitaAI existe para cambiar eso: que enterarte de la licitación correcta deje de ser un privilegio de las grandes empresas.”
          </blockquote>
          <div className="flex items-center gap-3 mt-8">
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">L</div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Equipo fundador</p>
              <p className="text-slate-500 text-sm">LicitaAI</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Planes simples</h2>
          <p className="text-slate-600 text-center mb-14">Menos que un empleado de medio tiempo. Cancela cuando quieras.</p>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-7 border ${
                  plan.highlight
                    ? 'bg-white border-blue-500 ring-1 ring-blue-500/30 shadow-lg relative'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">Más popular</span>
                )}
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-slate-500 text-sm"> USD / mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/signup"
                  className={`block text-center font-medium px-5 py-3 rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  Empezar con {plan.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">Preguntas frecuentes</h2>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {FAQ.map((item) => (
            <details key={item.q} name="faq" className="group py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-slate-900">
                {item.q}
                <span className="text-slate-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="text-slate-600 text-sm leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para no perder otra licitación?</h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">Crea tu cuenta gratis y configura tu perfil en menos de 2 minutos.</p>
          <a href="/signup" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-lg transition-colors inline-flex items-center gap-2">
            Empezar gratis <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">🏛 LicitaAI</span>
          <span>© {new Date().getFullYear()} LicitaAI. Licitaciones de gobierno para PYMES en América Latina.</span>
        </div>
      </footer>
    </div>
  )
}
