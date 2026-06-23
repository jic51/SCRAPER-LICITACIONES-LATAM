/**
 * Scraper del Diario Oficial de la Federación (DOF)
 *
 * El DOF publica diariamente convocatorias a licitación pública de TODAS las
 * dependencias federales. Es la fuente más fresca: aparecen el mismo día de
 * publicación, con hasta 6–12 meses de ventaja sobre los CSVs de ComprasMX.
 *
 * Estrategia:
 *  1. Buscar "LICITACION PUBLICA" en dof.gob.mx/buscar.php con rango de fecha
 *     (últimos N días) para obtener la lista HTML de resultados.
 *  2. Parsear el HTML: extraer código DOF, título, dependencia y fecha.
 *  3. Para cada resultado, construir la URL de la nota como pdf_url.
 */

import { fetch as undiciFetch, Agent } from 'undici'
import { inferSector, type RawInsert } from './ocds'

const DOF_BASE = 'https://dof.gob.mx'
const PORTAL_PREFIX = 'MX-DOF'

const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } })

const BROWSER_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,*/*',
  'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Cache-Control': 'no-cache',
  Referer: 'https://dof.gob.mx/',
}

// Formatea fecha a DD/MM/YYYY (display) y DD%2FMM%2FYYYY (URL-encoded)
function fmtDate(d: Date): { display: string; encoded: string } {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return {
    display: `${dd}/${mm}/${yyyy}`,
    encoded: `${dd}%2F${mm}%2F${yyyy}`,
  }
}

// Convierte DD/MM/YYYY → YYYY-MM-DD (ISO)
function dofToIso(s: string): string | null {
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

// Decodifica entidades HTML básicas
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

// Extrae importe en pesos de texto como "$1,234,567.89" o "1234567"
function extractAmount(text: string): number | null {
  const m = text.match(/\$\s*([\d,]+(?:\.\d+)?)/i)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser HTML del DOF
//
// El DOF devuelve una tabla HTML con esta estructura aproximada:
//
//   <table class="tabla-resultado"> (u otras clases)
//     <tr>
//       <td><b><a href="nota_detalle.php?codigo=5XXXXXX&fecha=23/06/2026">
//         CONVOCATORIA A LICITACION PUBLICA NACIONAL No. ...
//       </a></b></td>
//       <td>SECRETARÍA DE EDUCACION PÚBLICA</td>
//       <td>Convocatorias y Avisos</td>
//       <td>23/06/2026</td>
//     </tr>
//   </table>
//
// Usamos regex porque no tenemos cheerio en producción.
// ─────────────────────────────────────────────────────────────────────────────
export function parseDofHtml(html: string): RawInsert[] {
  const results: RawInsert[] = []

  // Extraer todos los bloques de nota (enlace + fila padre)
  // Patrón: href que apunta a nota_detalle.php con codigo= y fecha=
  // El DOF codifica el & como &amp; en el HTML de resultados.
  const notaRe =
    /href=["'](?:\.\.\/|\/)?nota_detalle(?:_popup)?\.php\?codigo=(\d+)(?:&amp;|&)fecha=([^"']+)["'][^>]*>\s*([\s\S]*?)\s*<\/a>/gi

  let m: RegExpExecArray | null
  while ((m = notaRe.exec(html)) !== null) {
    const codigo = m[1]
    const fechaRaw = decodeURIComponent(m[2].replace(/&amp;/g, '&'))
    const titleRaw = decodeHtml(m[3].replace(/<[^>]+>/g, ' '))

    if (!titleRaw || titleRaw.length < 10) continue

    // Filtrar solo convocatorias / licitaciones (no otro tipo de nota)
    const tUpper = titleRaw.toUpperCase()
    if (
      !tUpper.includes('LICITACI') &&
      !tUpper.includes('CONVOCATORIA') &&
      !tUpper.includes('CONCURSO') &&
      !tUpper.includes('INVITACI')
    ) continue

    const fechaIso = dofToIso(fechaRaw)

    // Buscar la dependencia: texto en la misma fila <tr> después del enlace.
    // Tomamos los 400 chars después del match para buscar las celdas vecinas.
    const context = html.slice(m.index, m.index + 800)
    const cellTexts: string[] = []
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let c: RegExpExecArray | null
    while ((c = tdRe.exec(context)) !== null) {
      const t = decodeHtml(c[1].replace(/<[^>]+>/g, ' '))
      if (t.length > 2) cellTexts.push(t)
    }
    // La primera celda es el título, las siguientes podrían ser dependencia/fecha.
    const agency =
      cellTexts.find(
        (t) =>
          t.toUpperCase() !== tUpper &&
          !t.match(/^\d{2}\/\d{2}\/\d{4}$/) &&
          !t.toLowerCase().includes('convocatoria') &&
          t.length > 5
      ) ?? null

    // Intentar extraer monto del título (a veces viene en el texto)
    const amount = extractAmount(titleRaw)

    const portalId = `${PORTAL_PREFIX}-${codigo}`
    const noteUrl = `${DOF_BASE}/nota_detalle.php?codigo=${codigo}&fecha=${encodeURIComponent(fechaRaw)}`

    results.push({
      portal_id: portalId.slice(0, 200),
      country_code: 'MX',
      title: titleRaw.slice(0, 500),
      agency: agency ? agency.slice(0, 200) : null,
      sector: inferSector(titleRaw),
      state: null,
      amount,
      deadline: null,
      published_at: fechaIso,
      pdf_url: noteUrl,
      procedure_num: null,
      email_convocante: null,
      procedure_status: 'EN PROCESO',
    })
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Búsqueda en el DOF
//
// Devuelve hasta `maxDays` días hacia atrás. El DOF pagina resultados cada
// 10 notas; fetcheamos hasta 5 páginas (50 resultados) para no abusar.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchDofLicitaciones(
  maxDays = 7,
  maxPages = 5
): Promise<{ rows: RawInsert[]; error?: string }> {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - maxDays)

  const hoy = fmtDate(now)
  const inicio = fmtDate(from)

  const allRows: RawInsert[] = []
  const seen = new Set<string>()

  // El DOF busca con query POST (form submission). Términos que cubren todo tipo
  // de convocatorias de licitación pública.
  const queries = ['LICITACION PUBLICA', 'CONVOCATORIA LICITACION']

  for (const q of queries) {
    for (let page = 1; page <= maxPages; page++) {
      const url =
        `${DOF_BASE}/buscar.php?q=${encodeURIComponent(q)}` +
        `&stype=todas` +
        `&dfecha=${inicio.encoded}` +
        `&hfecha=${hoy.encoded}` +
        `&pg=${page}`

      let html: string
      try {
        const res = await undiciFetch(url, {
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(30_000),
          dispatcher: insecureAgent,
        })
        if (!res.ok) return { rows: allRows, error: `HTTP ${res.status} en búsqueda DOF` }
        html = await res.text()
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return { rows: allRows, error: `Error al conectar con DOF: ${msg}` }
      }

      // Si el DOF devuelve "sin resultados" o página vacía, parar.
      if (
        html.includes('sin resultados') ||
        html.includes('No se encontraron') ||
        !html.includes('nota_detalle')
      ) {
        break
      }

      const rows = parseDofHtml(html)
      if (rows.length === 0) break

      for (const r of rows) {
        if (!seen.has(r.portal_id)) {
          seen.add(r.portal_id)
          allRows.push(r)
        }
      }

      // Si la página tiene menos de 10 resultados, es la última.
      if (rows.length < 10) break
    }
  }

  return { rows: allRows }
}
