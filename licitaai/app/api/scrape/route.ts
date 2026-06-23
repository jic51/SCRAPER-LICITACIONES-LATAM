import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetch as undiciFetch, Agent, type RequestInit as UndiciRequestInit } from 'undici'
import { extractReleases, releaseToLicitacion, type RawInsert } from '@/lib/scraper/ocds'
import { parseCsv } from '@/lib/scraper/csv'
import { fetchDofLicitaciones } from '@/lib/scraper/dof'
import { SOURCES, type Source } from '@/lib/scraper/sources'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Muchos servidores de gobierno publican su cadena de certificados incompleta.
// Este agente tolera esos certificados defectuosos (solo leemos datos públicos).
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } })

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
  headers?: string[]
}

// Tope de tamaño de respuesta para no agotar memoria (30 MB).
const MAX_BYTES = 30_000_000

function describeShape(json: unknown): string | string[] {
  if (Array.isArray(json)) return '[array]'
  if (json && typeof json === 'object') return Object.keys(json as Record<string, unknown>)
  return typeof json
}

const BROWSER_HEADERS = {
  Accept: 'text/csv,application/json,*/*',
  'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

// Descarga un CSV grande priorizando lo MÁS RECIENTE. Los archivos de Compras
// MX están ordenados del más viejo al más nuevo, así que pedimos el TRAMO FINAL
// del archivo (suffix range) para traer las últimas filas. Como ese tramo no
// incluye el encabezado, lo traemos aparte con una petición pequeña al inicio.
async function fetchRecentCsv(
  url: string
): Promise<{ ok: true; text: string; bytes: number } | { ok: false; status: number }> {
  const tailRes = await undiciFetch(url, {
    headers: { ...BROWSER_HEADERS, Range: 'bytes=-4000000' },
    signal: AbortSignal.timeout(45_000),
    dispatcher: insecureAgent,
  })
  if (!tailRes.ok && tailRes.status !== 206) {
    return { ok: false, status: tailRes.status }
  }
  const contentRange = tailRes.headers.get('content-range') // "bytes 106133160-110133159/110133160"
  const tailBuf = await tailRes.arrayBuffer()
  const tailText = new TextDecoder('windows-1252').decode(tailBuf)

  // Si el servidor ignoró el Range (200) o el tramo empieza en el byte 0, ya
  // tenemos el archivo completo (con encabezado): se usa tal cual.
  const wholeFile = tailRes.status === 200 || !contentRange || /bytes\s+0[-/]/.test(contentRange)
  if (wholeFile) {
    return { ok: true, text: tailText, bytes: tailBuf.byteLength }
  }

  // Tramo parcial: traemos el encabezado del inicio y descartamos la primera
  // línea del tramo (que viene cortada a la mitad).
  const headRes = await undiciFetch(url, {
    headers: { ...BROWSER_HEADERS, Range: 'bytes=0-100000' },
    signal: AbortSignal.timeout(20_000),
    dispatcher: insecureAgent,
  })
  const headText = new TextDecoder('windows-1252').decode(await headRes.arrayBuffer())
  const headerLine = headText.slice(0, headText.indexOf('\n'))
  const tailBody = tailText.slice(tailText.indexOf('\n') + 1)
  return { ok: true, text: `${headerLine}\n${tailBody}`, bytes: tailBuf.byteLength }
}

// Elimina filas duplicadas por (portal_id, country_code) dentro de un mismo
// lote. El CSV repite un expediente cuando tiene varios anuncios/contratos, y
// Postgres rechaza un upsert con la misma llave dos veces en la misma orden.
function dedupeRows(rows: RawInsert[]): RawInsert[] {
  const seen = new Map<string, RawInsert>()
  for (const r of rows) {
    const key = `${r.country_code}::${r.portal_id}`
    if (!seen.has(key)) seen.set(key, r)
  }
  return Array.from(seen.values())
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

  // Modo descubridor: ?discover=<baseUrl> prueba rutas OCDS comunes sobre una
  // base de portal estatal y reporta cuáles responden con JSON y qué forma
  // tienen. Sirve para confirmar el endpoint correcto de un portal nuevo sin
  // adivinar a mano. Ej:
  //   /api/scrape?secret=...&discover=https://datosabiertostianguisdigital.cdmx.gob.mx/api/v1
  const rawDiscoverMatch = req.url.match(/[?&]discover=(.+)$/)
  const discover = rawDiscoverMatch ? decodeURIComponent(rawDiscoverMatch[1]) : null
  if (discover) {
    const base = discover.replace(/\/+$/, '')
    // Rutas OCDS típicas en portales de gobierno (CKAN, EDCA, OCDS API estándar).
    const paths = [
      '/releases', '/records', '/tenders', '/contractingprocess',
      '/release_package', '/record_package', '/edca', '/ocds',
      '/plannings', '/contracts', '/api/ocds/releases',
      // Plataforma "Contratos/Contrataciones Abiertas" (CDMX, Jalisco, etc.)
      '/api/licitaciones', '/api/contratos', '/api/licitaciones/1', '',
    ]
    const results: Array<{ url: string; status: number | string; json: boolean; shape?: string | string[]; releases?: number }> = []
    await Promise.all(paths.map(async (p) => {
      const target = `${base}${p}`
      try {
        const res = await undiciFetch(target, {
          headers: { ...BROWSER_HEADERS, Accept: 'application/json, */*' },
          signal: AbortSignal.timeout(15_000),
          dispatcher: insecureAgent,
        })
        const text = await res.text()
        let json = false
        let shape: string | string[] | undefined
        let releases: number | undefined
        try {
          const parsed: unknown = JSON.parse(text)
          json = true
          shape = describeShape(parsed)
          releases = extractReleases(parsed).length
        } catch { /* no es JSON */ }
        results.push({ url: target, status: res.status, json, shape, releases })
      } catch (e) {
        results.push({ url: target, status: e instanceof Error ? e.message : 'error', json: false })
      }
    }))
    // Ordena: primero los que devuelven releases OCDS, luego JSON, luego el resto.
    results.sort((a, b) => (b.releases ?? 0) - (a.releases ?? 0) || Number(b.json) - Number(a.json))
    return NextResponse.json({ discover: base, candidates: results })
  }

  // Modo explorador: ?probe=<url> trae cualquier URL a través de esta máquina
  // (con bypass de certificado/Akamai) y devuelve la respuesta cruda. Sirve
  // para descubrir endpoints de portales que no podemos inspeccionar de otra
  // forma. Para no romperse cuando la URL objetivo trae sus propios ?param=,
  // tomamos todo lo que viene crudo después de "probe=" en la URL original.
  const rawProbeMatch = req.url.match(/[?&]probe=(.+)$/)
  const probe = rawProbeMatch ? decodeURIComponent(rawProbeMatch[1]) : null
  if (probe) {
    try {
      const isPost = url.searchParams.get('post') === '1'
      const referer = url.searchParams.get('ref') ?? 'https://comprasmx.buengobierno.gob.mx/sitiopublico/'
      const res = await undiciFetch(probe, {
        method: isPost ? 'POST' : 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Origin: 'https://comprasmx.buengobierno.gob.mx',
          Referer: referer,
          'Cache-Control': 'no-cache',
          ...(isPost ? { 'Content-Type': url.searchParams.get('ct') ?? 'application/json' } : {}),
        },
        body: isPost ? (url.searchParams.get('payload') ?? '{}') : undefined,
        signal: AbortSignal.timeout(30_000),
        dispatcher: insecureAgent,
      })
      const text = await res.text()

      // ?snippet=<palabra> -> devuelve fragmentos de texto alrededor de cada
      // aparición de esa palabra. Sirve para ver cómo un bundle JS arma una URL
      // (p.ej. cómo concatena la base del API con "/procedimiento").
      const snippetKey = url.searchParams.get('snippet')
      if (snippetKey) {
        const out: string[] = []
        const lower = text.toLowerCase()
        const key = snippetKey.toLowerCase()
        let from = 0
        while (out.length < 40) {
          const i = lower.indexOf(key, from)
          if (i === -1) break
          out.push(text.slice(Math.max(0, i - 140), i + key.length + 140))
          from = i + key.length
        }
        return NextResponse.json({ probe, status: res.status, matches: out.length, snippets: out })
      }

      // ?extract=urls -> en vez del cuerpo crudo, devuelve todas las URLs y
      // rutas tipo API encontradas en el contenido. Ideal para descubrir el
      // backend de una SPA escondido en su bundle de JavaScript.
      if (url.searchParams.get('extract') === 'urls') {
        const absolute = text.match(/https?:\/\/[a-zA-Z0-9._~:/?#@!$&'()*+,;=%-]+/g) ?? []
        // Rutas relativas dentro de comillas que parezcan endpoints de API.
        const relative = (text.match(/["'`](\/[a-zA-Z0-9_\-/.]{2,})["'`]/g) ?? [])
          .map((s) => s.slice(1, -1))
          .filter((s) => /api|servic|consult|buscar|procedimiento|anuncio|contrat|dato/i.test(s))
        const clean = (s: string) => s.replace(/["'`\\].*$/, '').replace(/[.,;)]+$/, '')
        const unique = Array.from(new Set([...absolute.map(clean), ...relative]))
          .filter((u) => !/\.(png|jpg|jpeg|svg|gif|ico|woff2?|ttf|css|map)(\?|$)/i.test(u))
          .filter((u) => !/w3\.org|googletagmanager|google\.com|gstatic|cdn\.gob\.mx\/(assets|gm)/i.test(u))
        return NextResponse.json({
          probe,
          status: res.status,
          totalFound: unique.length,
          urls: unique.slice(0, 120),
        })
      }

      return NextResponse.json({
        probe,
        status: res.status,
        contentType: res.headers.get('content-type'),
        length: text.length,
        body: text.slice(0, 6000),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const cause = e instanceof Error && e.cause ? ` — causa: ${String((e.cause as { message?: string }).message ?? e.cause)}` : ''
      return NextResponse.json({ probe, error: msg + cause })
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const summary: SummaryRow[] = []

  for (const source of SOURCES) {
    const row: SummaryRow = { source: source.name }
    try {
      let rows: RawInsert[] = []

      if (source.format === 'dof') {
        // Scraper HTML del DOF: busca convocatorias en los últimos 7 días.
        const result = await fetchDofLicitaciones(7, 5)
        if (result.error && result.rows.length === 0) {
          row.error = result.error
          summary.push(row)
          continue
        }
        if (result.error) row.error = result.error  // error parcial — igual upsert lo que se pudo
        rows = result.rows
        row.fetched = rows.length
        row.normalized = rows.length
        if (debug) row.sampleRaw = JSON.stringify(rows.slice(0, 2)).slice(0, 4000)
      } else if (source.format === 'csv') {
        // Descarga el tramo final (lo más reciente) + encabezado del inicio.
        const csv = await fetchRecentCsv(source.url)
        if (!csv.ok) {
          row.error = `HTTP ${csv.status}`
          summary.push(row)
          continue
        }
        if (debug) row.bytes = csv.bytes
        const parsed = parseCsv(csv.text, source)
        rows = parsed.rows
        row.fetched = parsed.total
        row.normalized = rows.length
        if (debug) {
          row.headers = parsed.headers
          row.sampleRaw = JSON.stringify(rows.slice(0, 2)).slice(0, 4000)
        }
      } else {
        const target = new URL(source.url)
        const init: UndiciRequestInit = {
          method: source.method ?? 'GET',
          headers: { ...BROWSER_HEADERS },
          signal: AbortSignal.timeout(55_000),
          dispatcher: insecureAgent,
        }
        if (source.method === 'POST') {
          init.body = new URLSearchParams(source.body ?? {})
        } else if (source.body) {
          for (const [k, v] of Object.entries(source.body)) target.searchParams.set(k, v)
        }
        const res = await undiciFetch(target, init)
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
          row.sampleRaw = JSON.stringify(releases.length ? releases.slice(0, 2) : json).slice(0, 8000)
        }
        rows = releases
          .map((r) => releaseToLicitacion(r, source))
          .filter((x): x is RawInsert => x !== null)
        row.normalized = rows.length
      }

      rows = dedupeRows(rows)

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
      // Node esconde el motivo real (DNS/TLS/conexión) en .cause
      if (e instanceof Error && e.cause) {
        row.error += ` — causa: ${String((e.cause as { message?: string }).message ?? e.cause)}`
      }
    }
    summary.push(row)
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), summary })
}
