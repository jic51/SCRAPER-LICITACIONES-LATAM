import type { NormalizeOpts } from './ocds'

export type Source = NormalizeOpts & {
  name: string
  url: string
}

// Fuentes de datos en formato OCDS. Para agregar un país/portal nuevo,
// basta con añadir una entrada aquí. El normalizador es el mismo para todas.
//
// NOTA: la URL exacta puede necesitar ajuste según el endpoint que exponga
// cada portal (algunos usan /tenders, /releases, paginación con ?page=, etc.).
// El normalizador tolera distintas envolturas de paquete OCDS.
export const SOURCES: Source[] = [
  {
    name: 'CDMX — Tianguis Digital (OCDS)',
    countryCode: 'MX',
    state: 'CDMX',
    portalPrefix: 'CDMX',
    url: 'https://datosabiertostianguisdigital.cdmx.gob.mx/api/v1/tenders',
  },
]
