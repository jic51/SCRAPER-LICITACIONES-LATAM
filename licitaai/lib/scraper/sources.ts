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

// Fuentes de datos. Para agregar un país/portal nuevo, basta con añadir una
// entrada aquí.
//
// CompraNet (SHCP) publica los contratos como archivos CSV directos, un archivo
// por año, con el patrón:
//   https://compranetinfo.hacienda.gob.mx/datosabiertos/Contratos{AÑO}.csv
export const SOURCES: Source[] = [
  {
    name: 'CompraNet — Contratos 2016 (CSV, SHCP)',
    countryCode: 'MX',
    state: null,
    portalPrefix: 'CN2016',
    url: 'https://compranetinfo.hacienda.gob.mx/datosabiertos/Contratos2016.csv',
    format: 'csv',
    limit: 100,
  },
]
