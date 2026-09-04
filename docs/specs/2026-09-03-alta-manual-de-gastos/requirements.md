# Requisitos — Alta manual de gastos

**Estado:** Borrador
**Fecha:** 2026-09-03
**Autor:** Manuel Aguilar

## Introducción

Hoy todo gasto en Finanzas Cumzi nace de un aviso de consumo que Santander manda por email. Cuando el gasto
no pasa por una tarjeta con aviso automático (efectivo, transferencia, o simplemente un aviso que nunca
llegó), no hay forma de registrarlo — el dashboard queda incompleto. Esta feature agrega un alta manual desde
el propio dashboard: un botón flotante abre un formulario corto (monto, comercio, fecha, categoría) que crea
el gasto y lo imputa al mes correspondiente, para que el dashboard refleje el gasto real del usuario sin
depender de que el banco haya mandado el email.

## Glosario

- **Alta manual** — gasto creado directamente por el usuario desde el dashboard, sin email de origen.
- **FAB** — botón flotante ("floating action button") que dispara la apertura del formulario.

## Requisitos

### Requisito 1 — Abrir el formulario de alta manual

**Historia de usuario:** Como usuario, quiero abrir un formulario de carga rápida desde el dashboard, para
registrar un gasto que no llegó por email del banco.

**Criterios de aceptación:**

1.1. WHEN el usuario visita `/dashboard` THE SYSTEM SHALL mostrar un botón flotante para agregar un gasto.
1.2. WHEN el usuario toca el botón flotante THE SYSTEM SHALL abrir un formulario modal sobre el dashboard,
     sin navegar a otra URL.
1.3. WHEN el usuario cierra el modal sin enviarlo THE SYSTEM SHALL descartar los datos ingresados sin crear
     ningún registro.

### Requisito 2 — Completar los datos del gasto

**Historia de usuario:** Como usuario, quiero indicar monto, comercio, fecha y categoría, para que el gasto
quede completo y correctamente imputado al mes que corresponde.

**Criterios de aceptación:**

2.1. THE SYSTEM SHALL requerir un monto expresado en formato ARS (ej. `$1.234,56`).
2.2. THE SYSTEM SHALL requerir un nombre de comercio no vacío.
2.3. THE SYSTEM SHALL requerir una fecha de gasto, con la fecha de hoy como valor por defecto.
2.4. THE SYSTEM SHALL requerir una categoría elegida entre las categorías fijas Salidas, Comida y Extras.
2.5. WHERE el formulario de alta manual está presente THE SYSTEM SHALL excluir "Sin categorizar" y
     "Descartar" de las opciones del selector de categoría.

### Requisito 3 — Validación y manejo de errores

**Historia de usuario:** Como usuario, quiero que el formulario me avise si algo está mal cargado, para no
terminar con un gasto incompleto o mal imputado en el dashboard.

**Criterios de aceptación:**

3.1. IF el monto ingresado no es un valor positivo parseable en formato ARS THEN THE SYSTEM SHALL rechazar
     el envío y mostrar el error inline, sin crear ningún registro.
3.2. IF el comercio está vacío THEN THE SYSTEM SHALL rechazar el envío y mostrar el error inline, sin crear
     ningún registro.
3.3. IF no se selecciona una categoría THEN THE SYSTEM SHALL rechazar el envío y mostrar el error inline,
     sin crear ningún registro.
3.4. THE SYSTEM SHALL garantizar que ningún camino de error deje un gasto o una imputación a medio cargar en
     la base de datos.

### Requisito 4 — Persistencia del gasto y su imputación

**Historia de usuario:** Como usuario, quiero que el gasto cargado a mano se guarde y se impute igual que uno
que llegó por email, para que el dashboard sume todo junto sin distinción.

**Criterios de aceptación:**

4.1. WHEN el usuario envía el formulario con datos válidos THE SYSTEM SHALL crear un registro en `gastos` con
     `email_id` nulo, `categoria_origen` "usuario" y la categoría elegida.
4.2. WHEN el gasto se crea THE SYSTEM SHALL crear exactamente una imputación por el monto total, en el mes
     que resulte de aplicar `mesDe` a la fecha ingresada.
4.3. WHEN el gasto y su imputación quedan creados correctamente THE SYSTEM SHALL marcar el gasto en estado
     `imputado`.
4.4. THE SYSTEM SHALL ejecutar la creación del gasto y de su imputación dentro de una única transacción — si
     cualquier paso falla, ningún dato queda escrito.

### Requisito 5 — Reflejo en el dashboard

**Historia de usuario:** Como usuario, quiero ver el gasto recién cargado reflejado en el dashboard de
inmediato, para confirmar que se guardó bien.

**Criterios de aceptación:**

5.1. WHEN el gasto se guarda exitosamente THE SYSTEM SHALL cerrar el modal y revalidar el dashboard, sin
     requerir que el usuario recargue la página a mano.
5.2. THE SYSTEM SHALL incluir el gasto cargado manualmente en los totales y filas del dashboard, en pie de
     igualdad con un gasto proveniente de un email del banco.

## Fuera de alcance

- Cuotas o imputación en múltiples meses para un gasto cargado a mano — siempre es pago único.
- Edición o borrado posterior de un gasto ya cargado manualmente.
- Botón flotante en pantallas distintas a `/dashboard` (ej. `/bandeja`, `/revision`).
- Categorización automática (reglas o IA) para el alta manual — el usuario siempre elige la categoría a mano.

## Preguntas abiertas

Ninguna — las decisiones de arquitectura (nullable `email_id`, formato ARS del input, FAB solo en dashboard,
modal en vez de página nueva, sin soporte de cuotas) ya quedaron resueltas en `/brainstorming`.
