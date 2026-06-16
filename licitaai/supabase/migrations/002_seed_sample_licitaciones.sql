-- Datos de muestra para poblar el dashboard mientras el scraper no está activo.
-- Realistas pero ilustrativos. Seguros de re-ejecutar (ON CONFLICT DO NOTHING).
-- Los sectores usan los mismos ids que lib/constants.ts (MEXICO_SECTORS) y los
-- estados los mismos strings de MEXICO_STATES, para que los filtros funcionen.

insert into licitaciones (portal_id, country_code, title, agency, sector, state, amount, deadline) values
  ('MX-CN-2026-0001','MX','Suministro de material médico y de curación — IMSS Jalisco','IMSS','salud','Jalisco',1200000, now() + interval '21 days'),
  ('MX-CN-2026-0002','MX','Mantenimiento de instalaciones — PEMEX Refinería Salina Cruz','PEMEX','construccion','Oaxaca',3800000, now() + interval '14 days'),
  ('MX-CN-2026-0003','MX','Servicios de limpieza para planteles escolares — SEP','SEP','limpieza','CDMX',280000, now() + interval '6 days'),
  ('MX-CN-2026-0004','MX','Adquisición de equipo de cómputo y licencias — SAT','SAT','tecnologia','Nuevo León',2500000, now() + interval '18 days'),
  ('MX-CN-2026-0005','MX','Construcción de camino rural tramo II — SCT Chiapas','SICT','construccion','Chiapas',12500000, now() + interval '30 days'),
  ('MX-CN-2026-0006','MX','Servicio de vigilancia y seguridad privada — Gobierno de Puebla','Gobierno de Puebla','seguridad','Puebla',1850000, now() + interval '11 days'),
  ('MX-CN-2026-0007','MX','Suministro de alimentos para comedores comunitarios — DIF','DIF','alimentacion','Estado de México',940000, now() + interval '9 days'),
  ('MX-CN-2026-0008','MX','Consultoría para transformación digital — Secretaría de Economía','Secretaría de Economía','consultoria','CDMX',1600000, now() + interval '16 days'),
  ('MX-CN-2026-0009','MX','Renovación de flota de transporte escolar — Gobierno de Jalisco','Gobierno de Jalisco','transporte','Jalisco',7200000, now() + interval '25 days'),
  ('MX-CN-2026-0010','MX','Equipamiento de aulas y mobiliario escolar — SEP Veracruz','SEP','educacion','Veracruz',540000, now() + interval '8 days'),
  ('MX-CN-2026-0011','MX','Mantenimiento de áreas verdes y jardinería — Municipio de Guadalajara','Municipio de Guadalajara','limpieza','Jalisco',1800000, now() + interval '6 days'),
  ('MX-CN-2026-0012','MX','Servicios de capacitación en ciberseguridad — Función Pública','Función Pública','educacion','CDMX',680000, now() + interval '13 days'),

  ('CO-SECOP-2026-0001','CO','Suministro de equipos de cómputo — Alcaldía de Medellín','Alcaldía de Medellín','tecnologia','Antioquia',620000000, now() + interval '9 days'),
  ('CO-SECOP-2026-0002','CO','Mantenimiento de vías urbanas — Gobernación de Cundinamarca','Gobernación de Cundinamarca','construccion','Cundinamarca',1500000000, now() + interval '20 days'),
  ('CO-SECOP-2026-0003','CO','Servicio de aseo para sedes administrativas — Distrito de Bogotá','Distrito de Bogotá','limpieza','Bogotá',340000000, now() + interval '7 days'),

  ('CL-MP-2026-0001','CL','Servicio de aseo y mantención de edificios — Municipalidad de Providencia','Municipalidad de Providencia','limpieza','Región Metropolitana',95000000, now() + interval '4 days'),
  ('CL-MP-2026-0002','CL','Adquisición de insumos médicos — Servicio de Salud Valparaíso','Servicio de Salud Valparaíso','salud','Valparaíso',180000000, now() + interval '15 days'),
  ('CL-MP-2026-0003','CL','Obras de conservación de infraestructura escolar — JUNJI','JUNJI','construccion','Biobío',260000000, now() + interval '22 days')
on conflict (portal_id, country_code) do nothing;
