import { describe, it, expect } from 'vitest'
import { parseDofHtml } from '@/lib/scraper/dof'

// HTML representativo que devuelve dof.gob.mx/buscar.php para resultados de
// "LICITACION PUBLICA". Los patrones reales pueden variar pero este fixture
// cubre los casos típicos.
const SAMPLE_HTML = `
<!DOCTYPE html>
<html>
<body>
<table class="tabla-resultado">
  <tr>
    <td colspan="4">
      <b><a href="nota_detalle.php?codigo=5756001&amp;fecha=20/06/2026">
        CONVOCATORIA A LICITACION PUBLICA NACIONAL No. SEP-DIGEPP-001-2026 — SUMINISTRO DE MATERIAL EDUCATIVO
      </a></b>
    </td>
  </tr>
  <tr>
    <td>SECRETARÍA DE EDUCACIÓN PÚBLICA</td>
    <td>Convocatorias y Avisos</td>
    <td>20/06/2026</td>
  </tr>

  <tr>
    <td colspan="4">
      <b><a href="nota_detalle.php?codigo=5756042&amp;fecha=20/06/2026">
        CONVOCATORIA A LICITACION PUBLICA INTERNACIONAL BAJO LA COBERTURA DE TRATADOS — EQUIPOS DE COMPUTO
      </a></b>
    </td>
  </tr>
  <tr>
    <td>INSTITUTO MEXICANO DEL SEGURO SOCIAL</td>
    <td>Convocatorias y Avisos</td>
    <td>20/06/2026</td>
  </tr>

  <tr>
    <td colspan="4">
      <b><a href="nota_detalle.php?codigo=5756099&amp;fecha=19/06/2026">
        DECRETO por el que se reforma el artículo 3 constitucional
      </a></b>
    </td>
  </tr>
  <tr>
    <td>SECRETARÍA DE GOBERNACIÓN</td>
    <td>Poder Ejecutivo</td>
    <td>19/06/2026</td>
  </tr>
</table>
</body>
</html>
`

describe('parseDofHtml', () => {
  it('extrae licitaciones y descarta notas que no son convocatorias', () => {
    const rows = parseDofHtml(SAMPLE_HTML)
    // Solo deben aparecer los 2 resultados de licitación, no el decreto
    expect(rows).toHaveLength(2)
  })

  it('asigna portal_id con prefijo MX-DOF y el código DOF', () => {
    const rows = parseDofHtml(SAMPLE_HTML)
    expect(rows[0].portal_id).toBe('MX-DOF-5756001')
    expect(rows[1].portal_id).toBe('MX-DOF-5756042')
  })

  it('convierte fecha DOF DD/MM/YYYY → ISO YYYY-MM-DD', () => {
    const rows = parseDofHtml(SAMPLE_HTML)
    expect(rows[0].published_at).toBe('2026-06-20')
  })

  it('asigna country_code MX y procedure_status EN PROCESO', () => {
    const rows = parseDofHtml(SAMPLE_HTML)
    expect(rows[0].country_code).toBe('MX')
    expect(rows[0].procedure_status).toBe('EN PROCESO')
  })

  it('construye pdf_url con URL de la nota DOF', () => {
    const rows = parseDofHtml(SAMPLE_HTML)
    expect(rows[0].pdf_url).toContain('nota_detalle.php')
    expect(rows[0].pdf_url).toContain('5756001')
  })

  it('infiere sector tecnologia para equipos de cómputo', () => {
    const rows = parseDofHtml(SAMPLE_HTML)
    const imss = rows.find((r) => r.portal_id.includes('5756042'))
    expect(imss?.sector).toBe('tecnologia')
  })

  it('retorna array vacío para HTML sin resultados', () => {
    const rows = parseDofHtml('<html><body>No se encontraron resultados.</body></html>')
    expect(rows).toHaveLength(0)
  })
})
