import { parse } from 'csv-parse/sync'
import { inferSector, type RawInsert } from './ocds'

export type CsvOpts = {
  countryCode: string
  state: string | null
  portalPrefix: string
  limit?: number
}

// Nombres de columna candidatos (en minúsculas) para cada campo de nuestro
// esquema. CompraNet varía un poco los encabezados entre años, así que
// probamos varios y usamos el primero que exista.
const CANDIDATES: Record<string, string[]> = {
  portalId: ['codigo_contrato', 'numero_procedimiento', 'codigo_expediente'],
  title: ['titulo_contrato', 'titulo_expediente', 'descripcion'],
  agency: ['dependencia', 'nombre_de_la_uc', 'siglas'],
  amount: ['importe_contrato', 'importe_pesos', 'importe'],
  deadline: ['fecha_fin', 'exp_f_fallo', 'proc_f_publicacion', 'fecha_inicio'],
  pdf: ['anuncio', 'direccion_anuncio'],
}

function pick(
  row: Record<string, string>,
  keysLower: Record<string, string>,
  cands: string[]
): string | null {
  for (const c of cands) {
    const real = keysLower[c]
    const val = real ? row[real]?.trim() : ''
    if (val) return val
  }
  return null
}

// Normaliza fechas: "2016-03-15 00:00:00" o "15/03/2016" -> "2016-03-15".
function toDate(v: string | null): string | null {
  if (!v) return null
  const s = v.trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

function toAmount(v: string | null): number | null {
  if (!v) return null
  const n = Number(v.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

export function parseCsv(
  text: string,
  opts: CsvOpts
): { rows: RawInsert[]; headers: string[]; total: number } {
  // Descarta la última línea (puede venir incompleta por descarga parcial).
  const lastNl = text.lastIndexOf('\n')
  const safe = lastNl > 0 ? text.slice(0, lastNl) : text

  const records = parse(safe, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[]

  const headers = records.length ? Object.keys(records[0]) : []
  const keysLower: Record<string, string> = {}
  for (const h of headers) keysLower[h.toLowerCase().trim()] = h

  const limit = opts.limit ?? 100
  const rows: RawInsert[] = []
  for (const rec of records.slice(0, limit)) {
    const title = pick(rec, keysLower, CANDIDATES.title)
    const pid = pick(rec, keysLower, CANDIDATES.portalId)
    if (!title || !pid) continue
    rows.push({
      portal_id: `${opts.portalPrefix}-${pid}`.slice(0, 200),
      country_code: opts.countryCode,
      title: title.slice(0, 500),
      agency: pick(rec, keysLower, CANDIDATES.agency),
      sector: inferSector(title),
      state: opts.state,
      amount: toAmount(pick(rec, keysLower, CANDIDATES.amount)),
      deadline: toDate(pick(rec, keysLower, CANDIDATES.deadline)),
      pdf_url: pick(rec, keysLower, CANDIDATES.pdf),
    })
  }
  return { rows, headers, total: records.length }
}
