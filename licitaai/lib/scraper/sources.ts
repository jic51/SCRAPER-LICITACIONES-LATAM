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

export const SOURCES: Source[] = [
  // Orden por prioridad: primero lo más reciente (2026), luego hacia atrás.
  // Los años que aún no existan dan 404 y se ignoran solos.
  // Expedientes = licitaciones/procedimientos publicados (lo que busca el cliente).
  // El gobierno suele publicar el archivo del año en curso a mediados del año.
  expedientesYear(2026),        // puede no existir aún → 404 silencioso
  expedientesYear(2025),
  expedientesYear(2024),

  // Contratos = ya adjudicados, pero traen el monto (Importe DRC).
  contratosYear(2026),          // puede no existir aún → 404 silencioso
  contratosYear(2025),
]
