import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getScoreColor, formatAmount, getDaysUntilDeadline, estimateMatchScore,
} from '@/lib/filters'
import type { Licitacion, UserFilters, FitScore } from '@/lib/types'

export const metadata = { title: 'Detalle de licitación — LicitaAI' }

const DEFAULT_FILTERS: UserFilters = {
  sectors: [], states: [], min_amount: 0, max_amount: 999_999_999, keywords: [],
}

const SECTOR_LABELS: Record<string, string> = {
  construccion: 'Construcción', tecnologia: 'Tecnología', limpieza: 'Limpieza',
  salud: 'Salud', educacion: 'Educación', seguridad: 'Seguridad',
  alimentacion: 'Alimentación', transporte: 'Transporte', consultoria: 'Consultoría',
}

const scoreColorClass = {
  green: { bar: 'bg-green-500', text: 'text-green-400', ring: 'border-green-500/40' },
  yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', ring: 'border-yellow-500/40' },
  red: { bar: 'bg-red-500', text: 'text-red-400', ring: 'border-red-500/40' },
}

// Estatutos que el gobierno asigna a procedimientos ya cerrados.
const CLOSED_STATUSES = new Set(['ADJUDICADO', 'ADJUDICADA', 'DESIERTA', 'CANCELADA', 'CANCELADO'])

function ScoreBreakdown({ licitacion, filters }: { licitacion: Licitacion; filters: UserFilters }) {
  const items: { label: string; detail: string; points: number; active: boolean }[] = []

  const hasSectors = filters.sectors.length > 0
  const sectorMatch = hasSectors && !!licitacion.sector &&
    filters.sectors.includes(licitacion.sector.toLowerCase())
  if (hasSectors && licitacion.sector) {
    items.push({
      label: 'Sector',
      detail: sectorMatch
        ? `Tu sector coincide (${SECTOR_LABELS[licitacion.sector] ?? licitacion.sector})`
        : `Tu sector no coincide (${SECTOR_LABELS[licitacion.sector] ?? licitacion.sector})`,
      points: sectorMatch ? +25 : -20,
      active: sectorMatch,
    })
  }

  const hasStates = filters.states.length > 0
  const stateMatch = hasStates && !!licitacion.state &&
    filters.states.some(s => s.toLowerCase() === licitacion.state!.toLowerCase())
  if (hasStates && licitacion.state) {
    items.push({
      label: 'Estado',
      detail: stateMatch
        ? `Tu estado coincide (${licitacion.state})`
        : `Tu estado no coincide (${licitacion.state})`,
      points: stateMatch ? +15 : -10,
      active: stateMatch,
    })
  }

  if (licitacion.amount !== null) {
    const inRange = licitacion.amount >= filters.min_amount && licitacion.amount <= filters.max_amount
    items.push({
      label: 'Monto',
      detail: inRange
        ? `Dentro de tu rango (${formatAmount(licitacion.amount)})`
        : `Fuera de tu rango (${formatAmount(licitacion.amount)})`,
      points: inRange ? +15 : -15,
      active: inRange,
    })
  }

  const hasKeywords = filters.keywords.length > 0
  if (hasKeywords) {
    const text = `${licitacion.title} ${licitacion.sector ?? ''}`.toLowerCase()
    const hits = filters.keywords.filter(kw => text.includes(kw.toLowerCase()))
    items.push({
      label: 'Palabras clave',
      detail: hits.length > 0
        ? `Coincide: ${hits.map(k => `"${k}"`).join(', ')}`
        : `Sin coincidencias de tus palabras clave`,
      points: hits.length > 0 ? +10 : -5,
      active: hits.length > 0,
    })
  }

  if (items.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        Configura tus filtros en <Link href="/settings" className="text-blue-400 hover:underline">Configuración</Link> para ver el análisis de compatibilidad.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-px bg-slate-700" />
        <span className="text-slate-500 text-xs uppercase tracking-wider">Base</span>
        <span className="text-slate-400 text-xs">55 pts</span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3">
          <span className={`text-lg mt-0.5 ${item.active ? 'text-green-400' : 'text-red-400'}`}>
            {item.active ? '✓' : '✗'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-white">{item.label}: </span>
            <span className="text-sm text-slate-400">{item.detail}</span>
          </div>
          <span className={`text-sm font-medium tabular-nums shrink-0 ${item.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {item.points > 0 ? `+${item.points}` : item.points}
          </span>
        </div>
      ))}
    </div>
  )
}

export default async function LicitacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: licitacion }, { data: filtersRow }, { data: fitScoreRow }] = await Promise.all([
    supabase.from('licitaciones').select('*').eq('id', id).single(),
    supabase.from('user_filters')
      .select('sectors, states, min_amount, max_amount, keywords')
      .eq('user_id', user!.id).maybeSingle(),
    supabase.from('fit_scores')
      .select('*').eq('licitacion_id', id).eq('user_id', user!.id).maybeSingle(),
  ])

  if (!licitacion) notFound()

  const l = licitacion as Licitacion
  const fs = fitScoreRow as FitScore | null
  const filters: UserFilters = { ...DEFAULT_FILTERS, ...(filtersRow ?? {}) }

  const score = fs?.score ?? estimateMatchScore(l, filters)
  const isEstimated = !fs
  const color = getScoreColor(score)
  const cls = scoreColorClass[color]
  const days = getDaysUntilDeadline(l.deadline)

  // Determinar estado del procedimiento
  const isClosed = l.procedure_status ? CLOSED_STATUSES.has(l.procedure_status) : false
  const isDeadlinePast = days !== null && days < 0
  const isExpired = isClosed || (days !== null && days < -30)

  // Status badge: qué mostrarle al usuario
  let statusLabel: string
  let statusCls: string
  let statusNote: string
  if (isClosed) {
    const label = l.procedure_status === 'ADJUDICADO' || l.procedure_status === 'ADJUDICADA'
      ? 'Adjudicada' : l.procedure_status === 'DESIERTA' ? 'Desierta' : 'Cancelada'
    statusLabel = label
    statusCls = 'bg-slate-800 text-slate-400 border-slate-700'
    statusNote = l.procedure_status === 'ADJUDICADO' || l.procedure_status === 'ADJUDICADA'
      ? 'Esta licitación ya fue asignada a un proveedor. Ya no puedes participar en ella.'
      : 'Este procedimiento fue declarado desierto o cancelado.'
  } else if (isDeadlinePast) {
    statusLabel = 'Vencida'
    statusCls = 'bg-red-900/30 text-red-400 border-red-800/40'
    statusNote = `El plazo para presentar propuestas venció hace ${Math.abs(days!)} días.`
  } else if (days === null) {
    statusLabel = 'Sin plazo publicado'
    statusCls = 'bg-yellow-900/20 text-yellow-500 border-yellow-800/30'
    statusNote = 'El gobierno no publicó una fecha de cierre. Puede ser adjudicación directa (sin concurso) o que los datos estén incompletos. Consulta la convocatoria oficial para confirmar.'
  } else {
    statusLabel = days === 0 ? 'Vence hoy' : `Vigente — ${days} días restantes`
    statusCls = days <= 5 ? 'bg-orange-900/30 text-orange-400 border-orange-800/40' : 'bg-green-900/20 text-green-400 border-green-800/30'
    statusNote = days === 0 ? '⚠️ Es el último día para presentar tu propuesta.'
      : days <= 5 ? `⚠️ Quedan solo ${days} días. Actúa rápido.`
      : `Tienes ${days} días para preparar y presentar tu propuesta.`
  }

  // Formateo de fechas
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Fecha de publicación oficial = cuándo el gobierno la publicó
  const pubDateLabel = l.published_at ? fmtDate(l.published_at) : null
  // Fecha que LicitaAI la detectó en los datos abiertos
  const foundLabel = fmtDate(l.found_at)
  // Plazo para propuestas
  const deadlineLabel = l.deadline ? fmtDate(l.deadline) : null

  // Código del expediente sin el prefijo de LicitaAI (MX-EXP2025-E-2025-XXXXX → E-2025-XXXXX)
  const expedienteCode = l.portal_id.replace(/^[A-Z]+-(?:EXP|CON)\d{4}-/, '')

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Volver al dashboard
        </Link>
      </div>

      {/* Score + título */}
      <div className={`bg-slate-900 border rounded-2xl p-6 mb-4 ${cls.ring}`}>
        <div className="flex items-start gap-5">
          {/* Score circle */}
          <div className={`shrink-0 w-20 h-20 rounded-full border-4 ${cls.ring} flex flex-col items-center justify-center`}>
            <span className={`text-2xl font-bold leading-none ${cls.text}`}>{score}</span>
            <span className="text-slate-400 text-xs">/ 100</span>
          </div>

          {/* Título y meta */}
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 mb-1">
              {l.country_code} · Exp. <span className="font-mono">{expedienteCode}</span>
              {l.procedure_num && (
                <span className="ml-2 text-slate-600">· Proc. <span className="font-mono">{l.procedure_num}</span></span>
              )}
            </p>
            <h1 className="text-xl font-bold leading-snug mb-2">{l.title}</h1>
            {isEstimated && (
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                Puntaje estimado · sin análisis IA
              </span>
            )}
          </div>
        </div>

        {/* Barra de score */}
        <div className="mt-5 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className={`h-2 rounded-full transition-all ${cls.bar}`} style={{ width: `${score}%` }} />
        </div>
      </div>

      {/* Status banner — lo más importante: ¿puedo participar? */}
      <div className={`border rounded-xl p-4 mb-6 ${statusCls}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5">
            {isClosed ? '🔒' : isDeadlinePast ? '⏰' : days === null ? '❓' : days <= 5 ? '⚡' : '✅'}
          </span>
          <div>
            <p className="font-semibold text-sm">{statusLabel}</p>
            <p className="text-sm opacity-80 mt-0.5">{statusNote}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Datos de la licitación */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-slate-200">Datos de la licitación</h2>
          <dl className="space-y-4 text-sm">
            {l.agency && (
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Entidad convocante</dt>
                <dd className="text-white">{l.agency}</dd>
              </div>
            )}
            {l.email_convocante && (
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Contacto del comprador</dt>
                <dd>
                  <a href={`mailto:${l.email_convocante}`} className="text-blue-400 hover:underline break-all">
                    {l.email_convocante}
                  </a>
                </dd>
              </div>
            )}
            {l.sector && (
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Sector</dt>
                <dd className="text-white">{SECTOR_LABELS[l.sector] ?? l.sector}</dd>
              </div>
            )}
            {l.state && (
              <div>
                <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Estado / Región</dt>
                <dd className="text-white">{l.state}</dd>
              </div>
            )}

            {/* Monto */}
            <div>
              <dt className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Monto presupuestal</dt>
              {l.amount !== null ? (
                <dd className="text-white font-medium">{formatAmount(l.amount)}</dd>
              ) : (
                <dd className="text-slate-500 text-xs leading-relaxed">
                  No publicado.{' '}
                  <span className="text-slate-600">
                    El gobierno frecuentemente no divulga el presupuesto hasta firmar el contrato.
                    Consulta la convocatoria oficial para conocerlo.
                  </span>
                </dd>
              )}
            </div>

            {/* Fechas — sección "desde / hasta" */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <dt className="text-slate-500 text-xs uppercase tracking-wider">Cronología</dt>

              {pubDateLabel && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Publicada por el gobierno</span>
                  <span className="text-white">{pubDateLabel}</span>
                </div>
              )}

              <div className="flex justify-between">
                {deadlineLabel ? (
                  <>
                    <span className="text-slate-400">Plazo para propuestas</span>
                    <span className={isDeadlinePast ? 'text-red-400' : days !== null && days <= 5 ? 'text-orange-400 font-medium' : 'text-white'}>
                      {deadlineLabel}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400">Plazo para propuestas</span>
                    <span className="text-slate-500 text-xs">No publicado</span>
                  </>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600 text-xs">Añadida a LicitaAI</span>
                <span className="text-slate-600 text-xs">{foundLabel}</span>
              </div>
            </div>
          </dl>
        </div>

        {/* Por qué este puntaje */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold mb-4 text-slate-200">Por qué este puntaje</h2>
          <ScoreBreakdown licitacion={l} filters={filters} />
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row gap-3">
        {l.pdf_url ? (
          <a
            href={l.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            <span>🔗</span> Ver convocatoria en ComprasMX
          </a>
        ) : (
          <span className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 text-slate-500 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed">
            🔗 Enlace no disponible
          </span>
        )}
        <Link
          href="/dashboard"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          ← Volver al dashboard
        </Link>
      </div>

      {isEstimated && (
        <p className="mt-6 text-center text-slate-500 text-xs">
          El análisis con IA del PDF completo estará disponible próximamente.
        </p>
      )}
    </div>
  )
}
