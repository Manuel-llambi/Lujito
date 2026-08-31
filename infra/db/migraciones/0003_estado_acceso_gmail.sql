-- Req. 1.5: medio persistente del latch "el acceso a Gmail está revocado, desde tal instante, con
-- tal detalle". Tabla de una sola fila (no un log de eventos): el estado actual de un único acceso.
-- No crea ningún tipo enumerado: ninguna columna es de dominio cerrado.
CREATE TABLE estado_acceso_gmail (
  id               smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  revocado_en      timestamptz,
  detalle          text,
  restablecido_en  timestamptz
);

-- Se siembra la única fila acá: le saca a los métodos el camino de "todavía no hay registro", que
-- si no existiría solo en producción y ninguna aserción visitaría.
INSERT INTO estado_acceso_gmail (id) VALUES (1);
