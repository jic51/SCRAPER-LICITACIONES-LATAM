import type { Licitacion } from '@/lib/types'

// Fila lista para insertar en la tabla `licitaciones` (sin id ni found_at,
// que la base genera sola).
export type RawInsert = Omit<Licitacion, 'id' | 'found_at'>

// Mapeo de palabras clave -> id de sector (los mismos ids de lib/constants.ts).
// Permite inferir el sector a partir del texto de la licitación.
const SECTOR_KEYWORDS: { id: string; words: string[] }[] = [
  { id: 'construccion', words: ['obra', 'construc', 'infraestructura', 'paviment', 'edificaci', 'remodel', 'manten', 'rehabilita'] },
  { id: 'tecnologia',   words: ['software', 'cómputo', 'computo', 'tecnolog', 'sistema', 'licencia', 'informát', 'informat', 'digital', 'hardware', 'telecom'] },
  { id: 'limpieza',     words: ['limpieza', 'aseo', 'jardiner', 'áreas verdes', 'areas verdes', 'fumigaci', 'recolecci'] },
  { id: 'salud',        words: ['médic', 'medic', 'salud', 'hospital', 'farmac', 'medicament', 'curaci', 'clínic', 'clinic'] },
  { id: 'educacion',    words: ['educa', 'escolar', 'capacit', 'enseñ', 'didáctic', 'didactic'] },
  { id: 'seguridad',    words: ['seguridad', 'vigilancia', 'custodia', 'protecci'] },
  { id: 'alimentacion', words: ['aliment', 'comida', 'despensa', 'víver', 'viver', 'comedor'] },
  { id: 'transporte',   words: ['transporte', 'vehícul', 'vehicul', 'flota', 'logíst', 'logist', 'combustible'] },
  { id: 'consultoria',  words: ['consultor', 'asesor', 'servicios profesionales', 'estudio', 'auditor'] },
]

export function inferSector(text: string): string | null {
  const t = text.toLowerCase()
  for (const s of SECTOR_KEYWORDS) {
    if (s.words.some((w) => t.includes(w))) return s.id
  }
  return null
}

// Forma (parcial) de un "release" OCDS. Todos los campos son opcionales
// porque las fuentes varían en qué publican.
export interface OCDSRelease {
  ocid?: string
  id?: string
  date?: string
  buyer?: { name?: string }
  tender?: {
    id?: string
    title?: string
    description?: string
    value?: { amount?: number; currency?: string }
    tenderPeriod?: { startDate?: string; endDate?: string }
    procuringEntity?: { name?: string }
    items?: Array<{ classification?: { description?: string } }>
    documents?: Array<{ url?: string; documentType?: string }>
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null
}

// Extrae los releases sin importar la envoltura del paquete OCDS:
// { releases: [] } | { records: [{ compiledRelease }] } | { results: [] } |
// { data: [] } | un arreglo | un release suelto.
export function extractReleases(json: unknown): OCDSRelease[] {
  if (Array.isArray(json)) return json.flatMap(extractReleases)
  const rec = asRecord(json)
  if (!rec) return []
  // CKAN (datos.gob.mx) envuelve todo en { result: { records: [...] } }.
  if (rec.result) return extractReleases(rec.result)
  if (Array.isArray(rec.releases)) return rec.releases as OCDSRelease[]
  if (Array.isArray(rec.records)) {
    return (rec.records as unknown[])
      .map((r) => {
        const rr = asRecord(r)
        if (!rr) return null
        if (rr.compiledRelease) return rr.compiledRelease as OCDSRelease
        if (Array.isArray(rr.releases) && rr.releases.length) return rr.releases[0] as OCDSRelease
        return null
      })
      .filter((x): x is OCDSRelease => x !== null)
  }
  if (Array.isArray(rec.results)) return (rec.results as unknown[]).flatMap(extractReleases)
  if (Array.isArray(rec.data)) return (rec.data as unknown[]).flatMap(extractReleases)
  if (rec.tender || rec.ocid) return [rec as OCDSRelease]
  return []
}

export type NormalizeOpts = {
  countryCode: string
  state: string | null
  portalPrefix: string
}

export function releaseToLicitacion(r: OCDSRelease, opts: NormalizeOpts): RawInsert | null {
  const tender = r.tender
  const title = tender?.title || tender?.description
  const ocid = r.ocid || r.id || tender?.id
  if (!title || !ocid) return null

  const itemsText = (tender?.items ?? []).map((i) => i.classification?.description ?? '').join(' ')
  const sector = inferSector(`${title} ${tender?.description ?? ''} ${itemsText}`)
  const pdf = (tender?.documents ?? []).find((d) => d.url)?.url ?? null

  return {
    portal_id: `${opts.portalPrefix}-${ocid}`.slice(0, 200),
    country_code: opts.countryCode,
    title: title.trim().slice(0, 500),
    agency: r.buyer?.name ?? tender?.procuringEntity?.name ?? null,
    sector,
    state: opts.state,
    amount: typeof tender?.value?.amount === 'number' ? Math.round(tender.value.amount) : null,
    deadline: tender?.tenderPeriod?.endDate ?? null,
    // Fecha de publicación del proceso: `date` del release OCDS, o el inicio
    // del periodo de licitación como respaldo.
    published_at: r.date ?? tender?.tenderPeriod?.startDate ?? null,
    pdf_url: pdf,
  }
}
