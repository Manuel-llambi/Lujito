-- Req. 4.1 (alta manual de gastos): un gasto cargado a mano no tiene ningún email de origen. El
-- UNIQUE y la FK a emails_crudos se preservan sin cambios: Postgres permite múltiples NULL en una
-- columna UNIQUE, así que dos altas manuales (o más) siguen sin chocar entre sí.
ALTER TABLE gastos ALTER COLUMN email_id DROP NOT NULL;
