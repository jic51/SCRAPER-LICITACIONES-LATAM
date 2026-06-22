import type { NormalizeOpts } from './ocds'

export type Source = NormalizeOpts & {
  name: string
  url: string
  method?: 'GET' | 'POST'
  format?: 'json' | 'csv'
  body?: Record<string, string>
  limit?: number
}

// Dominio activo (migrado de compranetinfo.hacienda.gob.mx y
// upcp-compranet.funcionpublica.gob.mx que ya no existen).
const BASE = 'https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes'

// Expedientes = licitaciones/procedimientos publicados (incluye estado por fila).
// Límite alto porque el archivo es grande (~110 MB) pero lo descargamos por Range.
function expedientesYear(year: number): Source {
  return {
    name: `Compras MX — Expedientes ${year}`,
    countryCode: 'MX',
    state: null,           // el CSV trae "Entidad Federativa" por fila
    portalPrefix: `MX-EXP${year}`,
    url: `${BASE}/Expedientes_PICompraNet${year}.csv`,
    format: 'csv',
    limit: 500,
  }
}

// Contratos = contratos firmados (incluye Importe DRC — el único campo con monto).
// Útil como fuente secundaria para enriquecer la vista con montos reales.
function contratosYear(year: number): Source {
  return {
    name: `Compras MX — Contratos ${year}`,
    countryCode: 'MX',
    state: null,
    portalPrefix: `MX-CON${year}`,
    url: `${BASE}/Contratos_CompraNet${year}.csv`,
    format: 'csv',
    limit: 300,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// FUENTES ESTATALES (México)
// Mientras el gobierno federal publica el CSV masivo 2026 (rezago de ~6-12
// meses), los portales estatales sí tienen datos vigentes del año en curso.
// Varios publican en estándar OCDS/EDCA (mismo formato JSON que ya parseamos),
// así que se integran sin código nuevo: solo se agregan aquí.
//
// IMPORTANTE: los endpoints estatales cambian con frecuencia. El motor ignora
// en silencio los que den 404/error (aparecen con `error` en el resumen del
// scraper). Corre `/api/scrape?secret=...&debug=1` para ver cuáles responden
// y deja activos solo esos.
// ──────────────────────────────────────────────────────────────────────────

// Fuente OCDS estatal. `releases` = el paquete OCDS del portal estatal.
function mxStateOcds(opts: {
  state: string
  name: string
  url: string
  method?: 'GET' | 'POST'
  body?: Record<string, string>
  prefix: string
}): Source {
  return {
    name: opts.name,
    countryCode: 'MX',
    state: opts.state,
    portalPrefix: opts.prefix,
    url: opts.url,
    method: opts.method ?? 'GET',
    body: opts.body,
    format: 'json',
    limit: 300,
  }
}

// CDMX — Tianguis Digital. Publica contrataciones en estándar EDCA (OCDS).
// Dominio VERIFICADO: datosabiertostianguisdigital.cdmx.gob.mx/api/v1/
// (se confirmó que el recurso /plannings existe). El recurso que devuelve los
// releases OCDS aún se debe confirmar con probe desde el servidor desplegado:
//   /api/scrape?secret=...&probe=https://datosabiertostianguisdigital.cdmx.gob.mx/api/v1/releases
// Si /releases no responde, probar /records, /tenders o /contractingprocess.
const CDMX_TIANGUIS = mxStateOcds({
  state: 'Ciudad de México',
  name: 'CDMX — Tianguis Digital (OCDS)',
  url: 'https://datosabiertostianguisdigital.cdmx.gob.mx/api/v1/releases',
  prefix: 'MX-CDMX',
})

// Jalisco — Plataforma de Contrataciones Abiertas (OCDS). Dominio del portal
// de gobierno abierto; endpoint OCDS exacto por confirmar con probe.
const JALISCO = mxStateOcds({
  state: 'Jalisco',
  name: 'Jalisco — Contrataciones Abiertas (OCDS)',
  url: 'https://contratacionesabiertas.jalisco.gob.mx/OCDS/',
  prefix: 'MX-JAL',
})

// Nuevo León — Datos Abiertos / Contrataciones Abiertas. Dominio VERIFICADO:
// nl.gob.mx/es/datosabiertos-contrataciones-abiertas. Endpoint OCDS por
// confirmar con probe desde el servidor desplegado.
const NUEVO_LEON = mxStateOcds({
  state: 'Nuevo León',
  name: 'Nuevo León — Contrataciones Abiertas (OCDS)',
  url: 'https://datosabiertos.nl.gob.mx/api/v1/releases',
  prefix: 'MX-NL',
})

// Estados con fuente estatal candidata. Se prueban en cada corrida; los que no
// respondan quedan registrados como error y no afectan al resto.
export const MX_STATE_SOURCES: Source[] = [
  CDMX_TIANGUIS,
  JALISCO,
  NUEVO_LEON,
]

export const SOURCES: Source[] = [
  // 1) Federal — Expedientes = procedimientos de contratación publicados.
  //    Incluyen el estatus (EN PROCESO, ADJUDICADO, DESIERTA, etc.) para que
  //    el dashboard pueda mostrar solo oportunidades abiertas.
  //    Los años que no existan dan 404 silencioso y se omiten automáticamente.
  expedientesYear(2026),        // puede no existir aún → 404 silencioso
  expedientesYear(2025),
  expedientesYear(2024),

  // NOTA: Contratos_CompraNetYYYY.csv NO se usa aquí. Ese archivo contiene
  // contratos ya firmados (resultado final de licitaciones ya cerradas).
  // Importarlos como "licitaciones" confunde al usuario: aparecen sin fecha
  // límite y con estatus "ADJUDICADO" mezclados con oportunidades abiertas.
  // Si se necesita enriquecer montos desde contratos, hacerlo en un job
  // separado que actualice licitaciones existentes por expediente_id.

  // 2) Estatales — datos vigentes del año en curso mientras llega el CSV
  //    federal 2026. Formato OCDS (JSON), se parsean con el mismo motor.
  ...MX_STATE_SOURCES,
]
