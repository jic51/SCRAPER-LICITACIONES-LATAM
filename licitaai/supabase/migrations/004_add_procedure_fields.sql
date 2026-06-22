-- Agrega datos del procedimiento que vienen en el CSV de Expedientes.
-- procedure_num  = Número de procedimiento de contratación (AA-90-006-...).
--                 Es el identificador oficial que el proveedor necesita para
--                 buscar en ComprasMX y referenciarse ante la convocante.
-- email_convocante = Correo de la unidad compradora (contacto directo).
-- procedure_status = Estatus del procedimiento (EN PROCESO, ADJUDICADO,
--                    DESIERTA, CANCELADA). Permite filtrar solo oportunidades
--                    abiertas sin importar si tienen fecha límite.
alter table licitaciones add column if not exists procedure_num text;
alter table licitaciones add column if not exists email_convocante text;
alter table licitaciones add column if not exists procedure_status text;
