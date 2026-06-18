import type { NormalizeOpts } from './ocds'

export type Source = NormalizeOpts & {
  name: string
  url: string
  method?: 'GET' | 'POST'
  // Para POST: se envía como application/x-www-form-urlencoded (form-data).
  body?: Record<string, string>
}

// Fuentes de datos en formato OCDS. Para agregar un país/portal nuevo,
// basta con añadir una entrada aquí. El normalizador es el mismo para todas.
//
// La API de CDMX (Tianguis Digital) expone el stage "plannings" vía POST con
// parámetros form-data. El normalizador tolera distintas envolturas de paquete.
export const SOURCES: Source[] = [
  {
    name: 'CDMX — Tianguis Digital (OCDS)',
    countryCode: 'MX',
    state: 'CDMX',
    portalPrefix: 'CDMX',
    url: 'https://datosabiertostianguisdigital.cdmx.gob.mx/api/v1/plannings',
    method: 'GET',
    body: {
      // Filtro para no descargar todo el histórico (evita respuestas enormes).
      // Formato dd/mm/yyyy según la doc del portal.
      start_date: '01/01/2026',
    },
  },
]
