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
}

// Motor de ingesta de licitaciones.
// Se protege con CRON_SECRET: el cron de Vercel envía `Authorization: Bearer <CRON_SECRET>`
// automáticamente; también se puede llamar manualmente con ?secret=<CRON_SECRET>.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const url = new URL(req.url)
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
    try {
      const res = await fetch(source.url, {
        headers: { Accept: 'application/json', 'User-Agent': 'LicitaAI-bot/1.0' },
      })
      if (!res.ok) {
        summary.push({ source: source.name, error: `HTTP ${res.status}` })
        continue
      }

      const json: unknown = await res.json()
      const releases = extractReleases(json)
      const rows: RawInsert[] = releases
        .map((r) => releaseToLicitacion(r, source))
        .filter((x): x is RawInsert => x !== null)

      if (rows.length === 0) {
        summary.push({ source: source.name, fetched: releases.length, normalized: 0, upserted: 0 })
        continue
      }

      const { error } = await supabase
        .from('licitaciones')
        .upsert(rows, { onConflict: 'portal_id,country_code' })

      if (error) {
        summary.push({ source: source.name, fetched: releases.length, normalized: rows.length, error: error.message })
        continue
      }

      summary.push({ source: source.name, fetched: releases.length, normalized: rows.length, upserted: rows.length })
    } catch (e) {
      summary.push({ source: source.name, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), summary })
}
