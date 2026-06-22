import { describe, it, expect } from 'vitest'
import { licitacionMatchesFilters, getScoreColor, formatAmount } from '@/lib/filters'
import type { Licitacion, UserFilters } from '@/lib/types'

const baseLic: Licitacion = {
  id: '1', portal_id: 'CPN-001', country_code: 'MX',
  title: 'Servicio de limpieza edificio federal',
  agency: 'SEP', sector: 'limpieza', state: 'CDMX',
  amount: 500000, deadline: '2026-07-01T00:00:00Z',
  pdf_url: null, found_at: '2026-06-11T02:00:00Z',
  published_at: '2026-06-10T00:00:00Z',
  procedure_num: null, email_convocante: null, procedure_status: null,
}

const baseFilters: UserFilters = {
  sectors: ['limpieza', 'construccion'],
  states: ['CDMX', 'Jalisco'],
  min_amount: 100000, max_amount: 5000000, keywords: [],
}

describe('licitacionMatchesFilters', () => {
  it('retorna true cuando todo coincide', () =>
    expect(licitacionMatchesFilters(baseLic, baseFilters)).toBe(true))

  it('retorna false cuando sector no coincide', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: ['tecnologia'] })).toBe(false))

  it('retorna false cuando estado no coincide', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, states: ['Nuevo León'] })).toBe(false))

  it('retorna false cuando monto está bajo el mínimo', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, min_amount: 1000000 })).toBe(false))

  it('retorna false cuando monto supera el máximo', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, max_amount: 400000 })).toBe(false))

  it('retorna true con sectors vacío (sin filtro)', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: [] })).toBe(true))

  it('retorna true con states vacío (sin filtro)', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, states: [] })).toBe(true))

  it('coincide por keyword en título', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: [], keywords: ['limpieza'] })).toBe(true))

  it('retorna false cuando keyword no coincide', () =>
    expect(licitacionMatchesFilters(baseLic, { ...baseFilters, sectors: [], keywords: ['telecomunicaciones'] })).toBe(false))

  it('comparación de estados es case-insensitive (scraper devuelve minúsculas)', () => {
    // licitacion.state = 'cdmx' (minúsculas del scraper), filtro tiene 'CDMX' → debe pasar
    const lic = { ...baseLic, state: 'cdmx' }
    expect(licitacionMatchesFilters(lic, { ...baseFilters, states: ['CDMX'] })).toBe(true)
  })

  it('pasa cuando sector no coincide pero keyword sí coincide (keywords como fallback amplio)', () => {
    // sectors=['tecnologia'] no coincide con sector='limpieza', pero keyword 'limpieza'
    // aparece en el título → debe pasar gracias al fallback de keywords
    const lic = { ...baseLic, sector: 'limpieza', title: 'Servicio de limpieza edificio federal' }
    expect(licitacionMatchesFilters(lic, { ...baseFilters, sectors: ['tecnologia'], keywords: ['limpieza'] })).toBe(true)
  })

  it('licitacion con sector null pasa aunque haya filtro de sectores activo', () => {
    // No se puede filtrar lo que no se reporta; el registro pasa para no descartar
    // licitaciones legítimas con datos incompletos
    const lic = { ...baseLic, sector: null }
    expect(licitacionMatchesFilters(lic, { ...baseFilters, sectors: ['construccion'] })).toBe(true)
  })
})

describe('getScoreColor', () => {
  it('green para score >= 70', () => expect(getScoreColor(70)).toBe('green'))
  it('yellow para score entre 40 y 69', () => expect(getScoreColor(55)).toBe('yellow'))
  it('red para score < 40', () => expect(getScoreColor(30)).toBe('red'))
})

describe('formatAmount', () => {
  it('formatea en pesos mexicanos', () => expect(formatAmount(500000)).toContain('500'))
  it('retorna texto cuando amount es null', () => expect(formatAmount(null)).toBe('Monto no especificado'))
})
