import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractReleases, releaseToLicitacion, type RawInsert } from '@/lib/scraper/ocds'
import { SOURCES } from '@/lib/scraper/sources'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type SummaryRow = {
  source: string
  fetched?: number
  normalized?: number
  upserted?: number
  error?: string
  // Solo con ?debug=1
  topKeys?: string | string[]
  sampleRaw?: string
  bytes?: number
}

// Tope de tamaño de respuesta para no agotar memoria (30 MB).
const MAX_BYTES = 30_000_000

function describeShape(json: unknown): string | string[] {
  if (Array.isArray(json)) return '[array]'
  if (json && typeof json === 'object') return Object.keys(json as Record<string, unknown>)
  return typeof json
}

// Motor de ingesta de licitaciones.
// Auth: el cron de Vercel envía `Authorization: Bearer <CRON_SECRET>` solo;
// manualmente se llama con ?secret=<CRON_SECRET>.
// ?debug=1 -> agrega la estructura cruda de la respuesta para diagnosticar.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const debug = url.searchParams.get('debug') === '1'

  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      url.searchParams.get('secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const summary: SummaryRow[] = []

  for (const source of SOURCES) {
    const row: SummaryRow = { source: source.name }
    try {
      const target = new URL(source.url)
      const init: RequestInit = {
        method: source.method ?? 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'LicitaAI-bot/1.0' },
        // Falla limpio en 25s en vez de colgarse para siempre.
        signal: AbortSignal.timeout(55_000),
      }
      if (source.method === 'POST') {
        init.body = new URLSearchParams(source.body ?? {})
      } else if (source.body) {
        // En GET los filtros van como query params.
        for (const [k, v] of Object.entries(source.body)) target.searchParams.set(k, v)
      }

      const res = await fetch(target, init)
      const text = await res.text()
      if (debug) row.bytes = text.length

      if (!res.ok) {
        row.error = `HTTP ${res.status}`
        if (debug) row.sampleRaw = text.slice(0, 500)
        summary.push(row)
        continue
      }
      if (text.length > MAX_BYTES) {
        row.error = `Respuesta demasiado grande (${text.length} bytes) — agrega más filtros.`
        summary.push(row)
        continue
      }

      const json: unknown = JSON.parse(text)
      const releases = extractReleases(json)
      row.fetched = releases.length

      if (debug) {
        row.topKeys = describeShape(json)
        row.sampleRaw = JSON.stringify(releases.length ? releases.slice(0, 2) : json).slice(0, 3000)
      }

      const rows: RawInsert[] = releases
        .map((r) => releaseToLicitacion(r, source))
        .filter((x): x is RawInsert => x !== null)
      row.normalized = rows.length

      if (rows.length > 0) {
        const { error } = await supabase
          .from('licitaciones')
          .upsert(rows, { onConflict: 'portal_id,country_code' })
        if (error) {
          row.error = error.message
        } else {
          row.upserted = rows.length
        }
      } else {
        row.upserted = 0
      }
    } catch (e) {
      row.error = e instanceof Error ? e.message : String(e)
    }
    summary.push(row)
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), summary })
}
