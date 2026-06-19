import { parse } from 'csv-parse/sync'
import { inferSector, type RawInsert } from './ocds'

export type CsvOpts = {
  countryCode: string
  state: string | null
  portalPrefix: string
  limit?: number
}

// Normaliza un encabezado de CSV a clave usable:
// - minúsculas, sin acentos, espacios → guión bajo, sin puntos/comas
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^\w\s]/g, '')                           // quita puntuación
    .trim()
    .replace(/\s+/g, '_')
}

// Nombres de columna candidatos (normalizados) para cada campo.
// Cubre el formato antiguo (CompraNet CSV por año) y el nuevo
// (Expedientes_PICompraNetYYYY.csv y Contratos_CompraNetYYYY.csv de
// upcp-compranet.buengobierno.gob.mx).
const CANDIDATES: Record<string, string[]> = {
  portalId: [
    'codigo_del_expediente', 'codigo_expediente',
    'codigo_del_contrato', 'codigo_contrato',
    'numero_procedimiento', 'num_del_contrato',
  ],
  title: [
    'titulo_del_expediente', 'titulo_expediente',
    'nombre_anuncio',
    'titulo_del_contrato', 'titulo_contrato',
    'descripcion_anuncio', 'descripcion',
  ],
  agency: [
    'institucion',
    'nombre_de_la_uc', 'dependencia', 'siglas',
  ],
  amount: [
    'importe_drc',
    'monto_sin_imp_maximo', 'monto_maximo_con_imp',
    'importe_contrato', 'importe_pesos', 'importe',
  ],
  deadline: [
    'vigencia_anuncio',
    'fecha_de_apertura', 'fecha_apertura',
    'fecha_de_fin_del_contrato', 'fecha_fin',
    'exp_f_fallo', 'proc_f_publicacion', 'fecha_inicio',
  ],
  state: [
    'entidad_federativa',
  ],
  pdf: [
    'direccion_anuncio', 'direccion_del_anuncio', 'anuncio',
  ],
}

function pick(
  row: Record<string, string>,
  keysNorm: Record<string, string>,
  cands: string[]
): string | null {
  for (const c of cands) {
    const real = keysNorm[c]
    const val = real ? row[real]?.trim() : ''
    if (val) return val
  }
  return null
}

// Normaliza fechas: "2025-01-21 00:54:43" | "17/02/2025" → "2025-01-21"
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

  // Mapa: clave normalizada → nombre real del encabezado en el CSV
  const keysNorm: Record<string, string> = {}
  for (const h of headers) keysNorm[normalizeHeader(h)] = h

  const limit = opts.limit ?? 200
  const rows: RawInsert[] = []
  for (const rec of records.slice(0, limit)) {
    const title = pick(rec, keysNorm, CANDIDATES.title)
    const pid = pick(rec, keysNorm, CANDIDATES.portalId)
    if (!title || !pid) continue

    // El estado viene por fila (Entidad Federativa) o del config de la fuente.
    const stateRaw = pick(rec, keysNorm, CANDIDATES.state) ?? opts.state
    const state = stateRaw ? stateRaw.trim().slice(0, 100) : null

    rows.push({
      portal_id: `${opts.portalPrefix}-${pid}`.slice(0, 200),
      country_code: opts.countryCode,
      title: title.slice(0, 500),
      agency: pick(rec, keysNorm, CANDIDATES.agency),
      sector: inferSector(title),
      state,
      amount: toAmount(pick(rec, keysNorm, CANDIDATES.amount)),
      deadline: toDate(pick(rec, keysNorm, CANDIDATES.deadline)),
      pdf_url: pick(rec, keysNorm, CANDIDATES.pdf),
    })
  }
  return { rows, headers, total: records.length }
}
