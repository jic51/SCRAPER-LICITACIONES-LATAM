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

// CDMX — "Contratos Abiertos" CDMX. Endpoint DOCUMENTADO por la comunidad OCDS
// que devuelve licitaciones en estándar EDCA/OCDS (array de releases). Doc:
// contratosabiertos.cdmx.gob.mx/datos-abiertos/documentacion-api-licitaciones
// (El sistema nuevo Tianguis Digital expone otra API en
//  datosabiertostianguisdigital.cdmx.gob.mx/api/v1/ — usar /discover si se
//  migra a esa.)
const CDMX_CONTRATOS = mxStateOcds({
  state: 'Ciudad de México',
  name: 'CDMX — Contratos Abiertos (OCDS)',
  url: 'http://www.contratosabiertos.cdmx.gob.mx/api/licitaciones',
  prefix: 'MX-CDMX',
})

// Jalisco — usa la MISMA plataforma "Contrataciones Abiertas". Portal
// verificado: contratacionesabiertas.jalisco.gob.mx/contratosabiertos/.
// El endpoint /api/licitaciones sigue el mismo patrón; confirmar con /discover.
const JALISCO = mxStateOcds({
  state: 'Jalisco',
  name: 'Jalisco — Contrataciones Abiertas (OCDS)',
  url: 'https://contratacionesabiertas.jalisco.gob.mx/api/licitaciones',
  prefix: 'MX-JAL',
})

// Nuevo León — Datos Abiertos / Contrataciones Abiertas. Publicador OCDS
// oficial (OCP Data Registry, publicación 149). Endpoint exacto por confirmar
// con /discover desde el servidor desplegado.
const NUEVO_LEON = mxStateOcds({
  state: 'Nuevo León',
  name: 'Nuevo León — Contrataciones Abiertas (OCDS)',
  url: 'https://datosabiertos.nl.gob.mx/api/licitaciones',
  prefix: 'MX-NL',
})

// Estados con fuente estatal candidata. Se prueban en cada corrida; los que no
// respondan quedan registrados como error y no afectan al resto.
export const MX_STATE_SOURCES: Source[] = [
  CDMX_CONTRATOS,
  JALISCO,
  NUEVO_LEON,
]

// NOTA SOBRE EL DOF (Diario Oficial de la Federación): se evaluó como fuente
// "en vivo" de licitaciones federales, pero se descartó. El DOF publica las
// convocatorias agrupadas en UNA sola nota diaria ("Licitaciones Públicas
// Nacionales e Internacionales") cuyo contenido es una IMAGEN/PDF escaneado,
// no texto extraíble (verificado: la palabra "CONVOCATORIA" no aparece en el
// HTML de la nota). Extraer licitaciones individuales requeriría OCR — frágil
// y de baja calidad. Para datos granulares y filtrables conviene ComprasMX
// (CSV estructurado) y los portales estatales OCDS (JSON).

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

  // 2) Estatales — DESACTIVADAS (2026-06). Se intentó integrar CDMX, Jalisco y
  //    Nuevo León vía OCDS, pero NO rinden el esfuerzo:
  //      • Cada portal estatal es un sistema distinto, sin API documentada
  //        estable, y que bloquea accesos automáticos (solo se prueban a mano).
  //      • CDMX: el portal viejo (contratosabiertos) está muerto (timeout); el
  //        nuevo (Tianguis Digital) expone otra API por confirmar.
  //      • Jalisco: ruta /api/licitaciones devuelve UnknownOperationException.
  //      • Nuevo León: NO tiene API en vivo, solo sube archivos JSON-OCDS
  //        sueltos a un portal CKAN (y el más reciente era de marzo 2025).
  //      • REDUNDANTES: el CSV federal de ComprasMX ya trae TODAS las entidades
  //        federativas por fila (columna "Entidad Federativa"), así que CDMX,
  //        Jalisco y NL ya entran por la fuente federal.
  //    Se dejan las definiciones (CDMX_CONTRATOS, JALISCO, NUEVO_LEON,
  //    MX_STATE_SOURCES) por si en el futuro se retoma alguna con /discover.
  //    Para reactivar: descomentar la línea de abajo.
  // ...MX_STATE_SOURCES,
]
