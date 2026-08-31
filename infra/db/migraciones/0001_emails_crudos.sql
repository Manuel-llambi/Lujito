-- Req. 1: el email crudo es la fuente de verdad y se guarda antes que nada.
CREATE TYPE estado_email AS ENUM ('pendiente', 'procesado', 'descartado', 'error');

CREATE TABLE emails_crudos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id   text NOT NULL UNIQUE,          -- Req. 1.2, 1.3 · idempotencia
  remitente          text NOT NULL,
  asunto             text NOT NULL,
  headers_crudos     text NOT NULL,                 -- Req. 1.1 · bloque de headers crudo, completo
  cuerpo             text NOT NULL,
  recibido_en        timestamptz NOT NULL,
  estado             estado_email NOT NULL DEFAULT 'pendiente',
  procesado_en       timestamptz
);
