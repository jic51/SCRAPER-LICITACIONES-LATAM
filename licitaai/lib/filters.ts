import type { Licitacion, UserFilters } from '@/lib/types'

export function licitacionMatchesFilters(
  licitacion: Licitacion,
  filters: UserFilters
): boolean {
  const { sectors, states, min_amount, max_amount, keywords } = filters

  if (sectors.length > 0 && licitacion.sector) {
    const sectorMatch = sectors.includes(licitacion.sector.toLowerCase())
    // Intentional: when keywords are present, a sector mismatch is allowed because the
    // keyword check below acts as a broad fallback matcher. If no keywords are set and
    // the sector doesn't match, we reject the licitacion.
    if (!sectorMatch && keywords.length === 0) return false
    // Note: if licitacion.sector is null/undefined the whole block is skipped. This is
    // intentional — we cannot match a sector that isn't reported, so we let the record
    // pass through rather than silently discarding potentially relevant licitaciones.
  }

  if (states.length > 0 && licitacion.state) {
    // Use case-insensitive comparison so that e.g. 'cdmx' from the scraper matches 'CDMX'
    // stored in the user's filter (from MEXICO_STATES). We don't lowercase the stored
    // values so display strings like 'CDMX' / 'Nuevo León' remain intact.
    if (!states.some(s => s.toLowerCase() === licitacion.state!.toLowerCase())) return false
  }

  if (licitacion.amount !== null) {
    if (licitacion.amount < min_amount || licitacion.amount > max_amount) return false
  }

  if (keywords.length > 0) {
    const text = `${licitacion.title} ${licitacion.sector ?? ''}`.toLowerCase()
    if (!keywords.some(kw => text.includes(kw.toLowerCase()))) return false
  }

  return true
}

export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

/**
 * Estima un puntaje de compatibilidad (0-100) entre una licitación y los
 * filtros del usuario. Es un cálculo determinista basado en datos reales del
 * perfil — NO usa IA. Se usa como respaldo cuando todavía no existe un
 * fit_score calculado por el motor de IA para esa licitación.
 */
export function estimateMatchScore(
  licitacion: Licitacion,
  filters: UserFilters
): number {
  let score = 55 // base neutra

  if (filters.sectors.length > 0 && licitacion.sector) {
    score += filters.sectors.includes(licitacion.sector.toLowerCase()) ? 25 : -20
  }

  if (filters.states.length > 0 && licitacion.state) {
    const match = filters.states.some(
      s => s.toLowerCase() === licitacion.state!.toLowerCase()
    )
    score += match ? 15 : -10
  }

  if (licitacion.amount !== null) {
    const inRange =
      licitacion.amount >= filters.min_amount &&
      licitacion.amount <= filters.max_amount
    score += inRange ? 15 : -15
  }

  if (filters.keywords.length > 0) {
    const text = `${licitacion.title} ${licitacion.sector ?? ''}`.toLowerCase()
    const hits = filters.keywords.filter(kw => text.includes(kw.toLowerCase())).length
    score += hits > 0 ? 10 : -5
  }

  return Math.max(0, Math.min(100, score))
}

export function formatAmount(amount: number | null): string {
  if (amount === null) return 'Monto no especificado'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(amount)
}

export function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const diffMs = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
