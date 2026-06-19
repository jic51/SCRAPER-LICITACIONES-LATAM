import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getScoreColor, formatAmount, getDaysUntilDeadline, estimateMatchScore,
} from '@/lib/filters'
import type { Licitacion, UserFilters, FitScore } from '@/lib/types'

export const metadata = { title: 'Dashboard — LicitaAI' }

const COUNTRY_NAMES: Record<string, string> = {
  MX: 'México', CO: 'Colombia', CL: 'Chile', PE: 'Perú', AR: 'Argentina',
}

const colorClass = { green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400' }

const DEFAULT_FILTERS: UserFilters = {
  sectors: [], states: [], min_amount: 0, max_amount: 999_999_999, keywords: [],
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mostrar?: string }>
}) {
  const { mostrar } = await searchParams
  const mostrarVencidas = mostrar === 'todas'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users').select('country_code').eq('id', user!.id).single()
  const countryCode = profile?.country_code ?? 'MX'

  // Traemos 200 licitaciones ordenadas por fecha de ingesta (las más recientes
  // del scraper primero). Luego filtramos, puntuamos y re-ordenamos en memoria.
  const [{ data: filtersRow }, { data: licitaciones }, { data: scores }] = await Promise.all([
    supabase.from('user_filters')
      .select('sectors, states, min_amount, max_amount, keywords')
      .eq('user_id', user!.id).maybeSingle(),
    supabase.from('licitaciones')
      .select('*').eq('country_code', countryCode)
      .order('found_at', { ascending: false }).limit(200),
    supabase.from('fit_scores')
      .select('licitacion_id, score').eq('user_id', user!.id),
  ])

  const filters: UserFilters = { ...DEFAULT_FILTERS, ...(filtersRow ?? {}) }
  const scoreById = new Map(
    (scores ?? []).map((s: Pick<FitScore, 'licitacion_id' | 'score'>) => [s.licitacion_id, s.score])
  )

  const allItems = ((licitaciones ?? []) as Licitacion[]).map((l) => {
    const stored = scoreById.get(l.id)
    const days = getDaysUntilDeadline(l.deadline)
    // Vencida = tiene deadline Y venció hace más de 30 días
    const isExpired = days !== null && days < -30
    // Fecha de publicación real del gobierno (si existe) o cuando la importamos
    const pubDate = l.published_at ?? l.found_at
    return {
      ...l,
      score: stored ?? estimateMatchScore(l, filters),
      source: stored !== undefined ? ('analizado' as const) : ('estimado' as const),
      isExpired,
      days,
      pubDate,
    }
  })

  // Por defecto: no vencidas (vigentes o recientes) ordenadas por score.
  // Con ?mostrar=todas: se incluyen también las vencidas (grises al fondo).
  const vigentes = allItems.filter((l) => !l.isExpired)
  const vencidas = allItems.filter((l) => l.isExpired)
  const items = mostrarVencidas
    ? [...vigentes.sort((a, b) => b.score - a.score), ...vencidas.sort((a, b) => b.score - a.score)]
    : vigentes.sort((a, b) => b.score - a.score)

  const high = vigentes.filter((l) => l.score >= 70).length
  const countryName = COUNTRY_NAMES[countryCode] ?? countryCode

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1">Licitaciones — {countryName}</h1>
          <p className="text-slate-400 text-sm">
            Vigentes: {vigentes.length} · Alta compatibilidad: {high}
            {vencidas.length > 0 && (
              <span className="ml-2 text-slate-600">· {vencidas.length} vencidas ocultas</span>
            )}
          </p>
        </div>
        {/* Toggle vigentes / todas */}
        <div className="flex gap-2 shrink-0">
          <Link
            href="/dashboard"
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              !mostrarVencidas
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            Solo vigentes
          </Link>
          <Link
            href="/dashboard?mostrar=todas"
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              mostrarVencidas
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            Todas
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium mb-1">
            {vigentes.length === 0 && vencidas.length > 0
              ? 'No hay licitaciones vigentes en este momento'
              : 'Aún no hay licitaciones para mostrar'}
          </p>
          <p className="text-slate-400 text-sm mb-4">
            {vigentes.length === 0 && vencidas.length > 0
              ? `Hay ${vencidas.length} licitaciones pasadas disponibles.`
              : `En cuanto el motor de búsqueda traiga nuevas oportunidades de ${countryName}, aparecerán aquí.`}
          </p>
          {vigentes.length === 0 && vencidas.length > 0 && (
            <Link
              href="/dashboard?mostrar=todas"
              className="inline-block text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors"
            >
              Ver historial de licitaciones →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => {
            const color = getScoreColor(l.score)
            const deadlineLabel =
              l.days === null ? 'Sin fecha límite'
              : l.days === 0 ? '⚠️ Vence hoy'
              : l.days > 0 && l.days <= 5 ? `⚠️ Vence en ${l.days} días`
              : l.days > 0 ? `Vence en ${l.days} días`
              : `Venció hace ${Math.abs(l.days)} días`
            const isUrgent = l.days !== null && l.days >= 0 && l.days <= 5
            const pubLabel = l.pubDate
              ? new Date(l.pubDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
              : null

            return (
              <Link
                key={l.id}
                href={`/licitaciones/${l.id}`}
                className={`bg-slate-900 border rounded-xl p-5 flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
                  l.isExpired
                    ? 'border-slate-800/50 opacity-50'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`text-2xl font-bold w-14 shrink-0 ${l.isExpired ? 'text-slate-600' : colorClass[color]}`}>
                    {l.score}%
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{l.title}</p>
                      {l.isExpired && (
                        <span className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded shrink-0">Vencida</span>
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${l.isExpired ? 'text-slate-600' : 'text-slate-400'}`}>
                      {l.agency ? `${l.agency} · ` : ''}{formatAmount(l.amount)}
                      {' · '}
                      <span className={isUrgent ? 'text-orange-400 font-medium' : ''}>
                        {deadlineLabel}
                      </span>
                      {pubLabel && (
                        <span className="ml-2 text-slate-500 text-xs">· Pub. {pubLabel}</span>
                      )}
                      {l.source === 'estimado' && (
                        <span className="ml-2 text-xs text-slate-500">(estimado)</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className={`text-sm ml-4 whitespace-nowrap shrink-0 ${l.isExpired ? 'text-slate-600' : 'text-blue-400'}`}>
                  Ver detalle →
                </span>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <p className="text-slate-400 text-sm text-center">
          🔄 El puntaje marcado como <span className="text-slate-300">(estimado)</span> se calcula con tus
          filtros. El análisis con IA del PDF completo llegará pronto.
        </p>
      </div>
    </div>
  )
}
