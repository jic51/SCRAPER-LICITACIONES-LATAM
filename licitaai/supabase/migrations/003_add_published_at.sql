-- Agrega la fecha de publicación original del portal de gobierno.
-- found_at = cuándo LicitaAI lo importó (siempre = hoy).
-- published_at = cuándo el gobierno lo publicó (extraída del CSV).
alter table licitaciones add column if not exists published_at timestamptz;
