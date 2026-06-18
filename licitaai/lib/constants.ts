export const MEXICO_SECTORS = [
  { id: 'construccion', label: 'Construcción e infraestructura' },
  { id: 'tecnologia', label: 'Tecnología y servicios digitales' },
  { id: 'limpieza', label: 'Limpieza y mantenimiento' },
  { id: 'salud', label: 'Salud y equipamiento médico' },
  { id: 'educacion', label: 'Educación y capacitación' },
  { id: 'seguridad', label: 'Seguridad y vigilancia' },
  { id: 'alimentacion', label: 'Alimentación y suministros' },
  { id: 'transporte', label: 'Transporte y logística' },
  { id: 'consultoria', label: 'Consultoría y servicios profesionales' },
  { id: 'otro', label: 'Otro sector' },
]

export const MEXICO_STATES = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','CDMX','Coahuila','Colima','Durango',
  'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco',
  'Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca',
  'Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa',
  'Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
]

export const AMOUNT_PRESETS = [
  { label: 'Hasta $500K MXN',    min: 0,          max: 500_000 },
  { label: '$500K – $2M MXN',    min: 500_000,     max: 2_000_000 },
  { label: '$2M – $10M MXN',     min: 2_000_000,   max: 10_000_000 },
  { label: '$10M – $50M MXN',    min: 10_000_000,  max: 50_000_000 },
  { label: 'Más de $50M MXN',    min: 50_000_000,  max: 999_999_999 },
]

export type CountryStatus = 'available' | 'soon'

export const COUNTRIES: {
  code: string; name: string; flag: string; status: CountryStatus; portal: string
}[] = [
  { code: 'MX', name: 'México',   flag: '🇲🇽', status: 'available', portal: 'CompraNet · Compras MX' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', status: 'soon',      portal: 'SECOP II' },
  { code: 'CL', name: 'Chile',    flag: '🇨🇱', status: 'soon',      portal: 'ChileCompra' },
]

// Estados/regiones por país. Hoy solo México está activo; los demás se
// agregarán cuando se integre su portal.
export const STATES_BY_COUNTRY: Record<string, string[]> = {
  MX: MEXICO_STATES,
}
