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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users').select('country_code').eq('id', user!.id).single()
  const countryCode = profile?.country_code ?? 'MX'

  const [{ data: filtersRow }, { data: licitaciones }, { data: scores }] = await Promise.all([
    supabase.from('user_filters')
      .select('sectors, states, min_amount, max_amount, keywords')
      .eq('user_id', user!.id).maybeSingle(),
    supabase.from('licitaciones')
      .select('*').eq('country_code', countryCode)
      .order('found_at', { ascending: false }).limit(50),
    supabase.from('fit_scores')
      .select('licitacion_id, score').eq('user_id', user!.id),
  ])

  const filters: UserFilters = { ...DEFAULT_FILTERS, ...(filtersRow ?? {}) }
  const scoreById = new Map(
    (scores ?? []).map((s: Pick<FitScore, 'licitacion_id' | 'score'>) => [s.licitacion_id, s.score])
  )

  const items = ((licitaciones ?? []) as Licitacion[])
    .map((l) => {
      const stored = scoreById.get(l.id)
      return {
        ...l,
        score: stored ?? estimateMatchScore(l, filters),
        source: stored !== undefined ? ('analizado' as const) : ('estimado' as const),
      }
    })
    .sort((a, b) => b.score - a.score)

  const high = items.filter((l) => l.score >= 70).length
  const countryName = COUNTRY_NAMES[countryCode] ?? countryCode

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Licitaciones recientes — {countryName}</h1>
        <p className="text-slate-400 text-sm">
          Encontradas: {items.length} · Alta compatibilidad: {high}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-xl text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium mb-1">Aún no hay licitaciones para mostrar</p>
          <p className="text-slate-400 text-sm">
            En cuanto el motor de búsqueda traiga nuevas oportunidades de {countryName}, aparecerán aquí
            ordenadas por compatibilidad con tu empresa.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => {
            const color = getScoreColor(l.score)
            const days = getDaysUntilDeadline(l.deadline)
            return (
              <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`text-2xl font-bold w-14 shrink-0 ${colorClass[color]}`}>{l.score}%</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {l.agency ? `${l.agency} · ` : ''}{formatAmount(l.amount)}
                      {' · '}{days !== null ? `Vence en ${days} días` : 'Sin fecha'}
                      {l.source === 'estimado' && (
                        <span className="ml-2 text-xs text-slate-500">(estimado)</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-blue-400 text-sm ml-4 whitespace-nowrap">Ver detalle →</span>
              </div>
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
