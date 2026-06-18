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
    name: 'A) histórico — búsqueda datasets (package_search)',
    countryCode: 'MX',
    state: null,
    portalPrefix: 'APF',
    url: 'https://historico.datos.gob.mx/busca/api/3/action/package_search',
    method: 'GET',
    body: { q: 'contrataciones compranet', rows: '5' },
  },
  {
    name: 'B) histórico — registros directos (datastore_search)',
    countryCode: 'MX',
    state: null,
    portalPrefix: 'APF',
    url: 'https://historico.datos.gob.mx/busca/api/3/action/datastore_search',
    method: 'GET',
    body: { resource_id: '0252e19f-bdd6-43de-af7b-106d4c7a82c8', limit: '5' },
  },
]
