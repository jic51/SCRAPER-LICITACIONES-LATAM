import type { NormalizeOpts } from './ocds'

export type Source = NormalizeOpts & {
  name: string
  url: string
  method?: 'GET' | 'POST'
  // 'csv' descarga y parsea un archivo CSV; por defecto se trata como JSON/OCDS.
  format?: 'json' | 'csv'
  // Para POST/GET: parámetros (form-data en POST, query string en GET).
  body?: Record<string, string>
  // Máximo de filas a importar por corrida (solo CSV).
  limit?: number
}

// CompraNet (SHCP) publica los contratos como archivos CSV directos, un archivo
// por año, con el patrón:
//   https://compranetinfo.hacienda.gob.mx/datosabiertos/Contratos{AÑO}.csv
// Generamos candidatos de años recientes; los que no existan darán 404 y se
// ignoran solos. Así descubrimos el año más reciente disponible.
function compranetYear(year: number): Source {
  return {
    name: `CompraNet — Contratos ${year} (CSV)`,
    countryCode: 'MX',
    state: null,
    portalPrefix: `CN${year}`,
    url: `https://compranetinfo.hacienda.gob.mx/datosabiertos/Contratos${year}.csv`,
    format: 'csv',
    limit: 40,
  }
}

export const SOURCES: Source[] = [
  compranetYear(2024),
  compranetYear(2023),
  compranetYear(2022),
  compranetYear(2021),
  compranetYear(2020),
  compranetYear(2019),
]
