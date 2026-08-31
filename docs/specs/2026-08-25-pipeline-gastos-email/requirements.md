# Requisitos — Pipeline de gastos desde emails del banco

**Estado:** Borrador
**Fecha:** 2026-08-25
**Autor:** Manuel

## Introducción

Hoy cada compra con tarjeta genera un aviso por email del banco, y el seguimiento del gasto mensual
depende de leer esos avisos a mano y anotarlos en algún lado. Esta feature automatiza ese trabajo: un
workflow toma cada aviso de consumo que llega a la casilla, extrae los datos de la compra, le asigna una
categoría, la imputa al mes o los meses que corresponda, y alimenta un dashboard de gastos mensuales.

El valor está en dos cosas. Primero, que el dato entre solo y sin errores de transcripción. Segundo, que
el sistema aprenda: cada vez que el usuario confirma o corrige una categoría, esa decisión queda como
regla y no vuelve a preguntarse. El objetivo es que la intervención manual tienda a cero con el uso.

El alcance de esta primera versión son los avisos de consumo de Santander con tarjeta de débito y de
crédito, en pesos argentinos, para un único usuario.

## Glosario

- **Aviso de consumo** — email que el banco envía tras una compra con tarjeta, con asunto `Pagaste $X`,
  cuyo cuerpo contiene una tabla con los campos de la operación.
- **Comercio** — cadena identificatoria del vendedor tal como la reporta el banco, habitualmente un
  código sin espacios y abreviado (ej. `WWWAYSACOMAR`, `PAYU*AR*UBER`).
- **Gasto** — la compra como hecho único: un monto total, un comercio, una fecha, una categoría.
- **Imputación** — el impacto de un gasto sobre un mes calendario concreto. Un gasto en N cuotas produce
  N imputaciones; un gasto en una cuota produce una.
- **Regla** — asociación persistida entre un patrón de comercio y una categoría, que evita volver a
  preguntar por ese comercio.
- **Origen de categoría** — quién decidió la categoría de un gasto: `regla`, `ia` o `usuario`.
- **`needs_review`** — estado de un gasto cuyos datos no pudieron determinarse con confianza y que
  requiere intervención del usuario antes de contar en los totales.
- **`descartado`** — estado de un email del remitente del banco que no es un aviso de consumo. No es un
  error.
- **Zona horaria de referencia** — `America/Argentina/Buenos_Aires`, usada para toda fecha y todo
  cálculo de mes.

## Requisitos

### Requisito 1 — Ingesta idempotente de avisos desde Gmail

**Historia de usuario:** Como usuario, quiero que los avisos de compra entren solos desde mi casilla,
para no tener que reenviar ni copiar nada a mano.

**Criterios de aceptación:**

1.1. WHEN llega a la casilla un email cuyo remitente es el remitente configurado del banco THE SYSTEM SHALL persistir el email crudo completo, con headers y cuerpo, antes de ejecutar cualquier otro paso del pipeline.
1.2. THE SYSTEM SHALL almacenar el identificador de mensaje de Gmail de cada email crudo bajo una restricción de unicidad.
1.3. IF se recibe un email cuyo identificador de mensaje de Gmail ya está almacenado THEN THE SYSTEM SHALL finalizar la ingesta sin crear un nuevo email crudo ni un nuevo gasto.
1.4. WHEN el token de acceso de Gmail está vencido THE SYSTEM SHALL renovarlo con el token de refresco y reintentar la operación.
1.5. IF el acceso a Gmail fue revocado THEN THE SYSTEM SHALL detener los reintentos y registrar el error de forma persistente y consultable, sin volver a llamar a Gmail hasta que el acceso se restablezca.
1.6. THE SYSTEM SHALL conservar el email crudo aunque todos los pasos posteriores del pipeline fallen.
1.7. THE SYSTEM SHALL ignorar los emails cuyo remitente no sea el remitente configurado del banco.

### Requisito 2 — Extracción determinista de los datos de la compra

**Historia de usuario:** Como usuario, quiero que los datos de la compra se lean del aviso de forma
exacta y repetible, para que ningún monto dependa de una interpretación.

**Criterios de aceptación:**

2.1. WHEN un email crudo entra al paso de extracción THE SYSTEM SHALL decodificar su cuerpo `quoted-printable` a texto UTF-8 antes de analizarlo.
2.2. THE SYSTEM SHALL localizar cada campo del aviso por el texto de su etiqueta normalizado — sin espacios sobrantes, sin saltos de línea y sin distinguir mayúsculas — y nunca por su posición dentro de la estructura del documento HTML.
2.3. WHEN el aviso contiene las etiquetas `Monto`, `Comercio`, `Fecha` y `Hora` THE SYSTEM SHALL extraer el valor asociado a cada una.
2.4. WHERE el aviso contiene la etiqueta `Cuotas` THE SYSTEM SHALL extraer su valor como la cantidad total de cuotas de la compra.
2.5. IF el aviso no contiene la etiqueta `Cuotas` THEN THE SYSTEM SHALL registrar la compra como de una única cuota.
2.6. THE SYSTEM SHALL extraer correctamente los campos aunque el HTML del aviso esté mal formado.
2.7. WHEN el aviso identifica la tarjeta como de débito THE SYSTEM SHALL registrar el tipo de tarjeta como `debito`.
2.8. WHEN el aviso identifica la tarjeta como de crédito THE SYSTEM SHALL registrar el tipo de tarjeta como `credito`.
2.9. THE SYSTEM SHALL extraer los últimos cuatro dígitos de la tarjeta desde el cuerpo del aviso.
2.10. THE SYSTEM SHALL determinar el tipo de tarjeta sin usar el asunto del email, que es idéntico para débito y crédito.
2.11. IF alguno de los campos monto, comercio, fecha, hora o tipo de tarjeta no puede extraerse THEN THE SYSTEM SHALL dejar el gasto en estado `needs_review` sin asignar valores por defecto a los campos faltantes.
2.12. THE SYSTEM SHALL registrar un monto únicamente cuando provenga de la extracción del aviso o de una corrección explícita del usuario.

### Requisito 3 — Normalización de montos y fechas

**Historia de usuario:** Como usuario, quiero que los importes y las fechas queden normalizados, para que
las sumas y los meses sean correctos sin importar el formato del banco.

**Criterios de aceptación:**

3.1. WHEN el monto extraído tiene formato de moneda argentina, con punto como separador de miles y coma como separador decimal THE SYSTEM SHALL normalizarlo a un valor decimal exacto.
3.2. THE SYSTEM SHALL almacenar los montos con precisión decimal exacta, sin representación en punto flotante binario.
3.3. WHEN se extraen la fecha en formato `DD/MM/AAAA` y la hora en formato `HH:MM` THE SYSTEM SHALL componer con ambas la fecha del gasto en la zona horaria de referencia.
3.4. THE SYSTEM SHALL tomar la fecha del gasto de los campos del cuerpo del aviso y nunca del header `Date` del email.
3.5. IF el monto normalizado es menor o igual a cero THEN THE SYSTEM SHALL dejar el gasto en estado `needs_review`.
3.6. IF la fecha del gasto resulta posterior al momento de la ingesta THEN THE SYSTEM SHALL dejar el gasto en estado `needs_review`.
3.7. IF la cantidad de cuotas extraída no es un entero mayor o igual a uno THEN THE SYSTEM SHALL dejar el gasto en estado `needs_review`.

### Requisito 4 — Descarte de emails que no son avisos de consumo

**Historia de usuario:** Como usuario, quiero que los emails del banco que no son compras se descarten
solos, para que la cola de errores muestre únicamente lo que necesita mi atención.

**Criterios de aceptación:**

4.1. IF un email del remitente del banco no contiene la estructura de un aviso de consumo THEN THE SYSTEM SHALL marcarlo como `descartado` y no crear un gasto a partir de él.
4.2. THE SYSTEM SHALL mantener el estado `descartado` como distinto del estado de error.
4.3. WHILE un email está en estado `descartado` THE SYSTEM SHALL excluirlo de la cola de errores y de todo cálculo de gastos.

### Requisito 5 — Categorización por reglas propias

**Historia de usuario:** Como usuario, quiero que los comercios que ya categoricé se resuelvan solos,
para no repetir la misma decisión dos veces.

**Criterios de aceptación:**

5.1. THE SYSTEM SHALL ofrecer exactamente tres categorías de gasto: `Salidas`, `Comida` y `Extras`.
5.2. WHEN un gasto termina la extracción THE SYSTEM SHALL evaluar las reglas activas contra el texto del comercio, en orden de prioridad descendente.
5.3. WHEN una regla coincide con el comercio THE SYSTEM SHALL asignar su categoría al gasto, registrar el origen de categoría como `regla` y dejar el gasto confirmado.
5.4. IF ninguna regla activa coincide con el comercio THEN THE SYSTEM SHALL derivar el gasto al paso de inferencia.
5.5. THE SYSTEM SHALL evaluar las reglas de forma determinista: la misma combinación de comercio y conjunto de reglas produce siempre la misma categoría.
5.6. WHEN dos o más reglas coinciden con el mismo comercio THE SYSTEM SHALL aplicar la de mayor prioridad.
5.7. THE SYSTEM SHALL considerar que una regla coincide cuando su patrón normalizado está contenido en el texto normalizado del comercio, entendiendo por normalizar el pasaje a mayúsculas, la eliminación de acentos y la colapsación de espacios consecutivos.
5.8. THE SYSTEM SHALL sembrar en la instalación inicial el conjunto de reglas de comercios conocidos definido en el diseño, con origen `usuario` y estado activo.

### Requisito 6 — Inferencia de categoría con IA

**Historia de usuario:** Como usuario, quiero que un comercio desconocido reciba una categoría propuesta
automáticamente, para que ningún gasto quede sin clasificar esperando que yo lo mire.

**Criterios de aceptación:**

6.1. WHEN un gasto llega al paso de inferencia THE SYSTEM SHALL solicitar al modelo una respuesta restringida al conjunto cerrado formado por `Salidas`, `Comida`, `Extras` y `no_estoy_seguro`, junto con una justificación breve.
6.2. THE SYSTEM SHALL invocar al modelo únicamente para gastos en los que ninguna regla coincidió.
6.3. WHEN la inferencia devuelve una categoría perteneciente al conjunto cerrado THE SYSTEM SHALL asignarla al gasto, registrar el origen de categoría como `ia` y dejar el gasto sin confirmar.
6.4. IF la respuesta del modelo no pertenece al conjunto cerrado THEN THE SYSTEM SHALL asignar al gasto la categoría `Sin categorizar`, registrar el origen de categoría como `ia` y dejarlo sin confirmar.
6.5. IF la invocación al modelo falla tras agotar sus reintentos THEN THE SYSTEM SHALL asignar la categoría `Sin categorizar` con origen `ia` y sin confirmar, y continuar con la imputación del gasto.
6.6. THE SYSTEM SHALL persistir la justificación devuelta por el modelo junto con el gasto, para mostrarla al usuario en la bandeja de confirmación.
6.7. IF el modelo responde `no_estoy_seguro` THEN THE SYSTEM SHALL asignar al gasto la categoría `Sin categorizar` con origen `ia` y sin confirmar, sin registrar ninguna categoría propuesta, de modo que la elección quede en manos del usuario.

### Requisito 7 — Bandeja de confirmación in-app

**Historia de usuario:** Como usuario, quiero confirmar o corregir las categorías que propuso la IA desde
la aplicación, para que el sistema aprenda mis criterios sin interrumpirme por otros canales.

**Criterios de aceptación:**

7.1. WHILE existan gastos con origen de categoría `ia` y sin confirmar THE SYSTEM SHALL mostrar en la aplicación un indicador con la cantidad de gastos pendientes de confirmación.
7.2. WHEN el usuario abre la bandeja THE SYSTEM SHALL listar cada gasto pendiente con su comercio, monto, fecha, categoría propuesta y la justificación de la inferencia.
7.3. WHEN el usuario confirma la categoría propuesta de un gasto THE SYSTEM SHALL registrar el momento de la confirmación y cambiar su origen de categoría a `usuario`.
7.4. WHEN el usuario corrige la categoría de un gasto THE SYSTEM SHALL reemplazarla por la elegida, registrar el momento de la confirmación y cambiar su origen de categoría a `usuario`.
7.5. WHEN el usuario confirma o corrige un gasto THE SYSTEM SHALL ofrecerle crear una regla que asocie el comercio de ese gasto con la categoría resultante.
7.6. WHEN el usuario acepta crear la regla THE SYSTEM SHALL persistirla activa, de modo que los gastos posteriores del mismo comercio se resuelvan por regla y no lleguen a la bandeja.
7.7. IF el usuario rechaza crear la regla THEN THE SYSTEM SHALL confirmar igualmente el gasto y no persistir regla alguna.
7.8. THE SYSTEM SHALL notificar los gastos pendientes únicamente dentro de la aplicación, sin enviar email ni notificaciones push.
7.9. WHEN un gasto pasa a estar confirmado THE SYSTEM SHALL retirarlo de la bandeja y descontarlo del indicador de pendientes.
7.10. WHEN un gasto pendiente tiene categoría `Sin categorizar` THE SYSTEM SHALL listarlo en la bandeja sin categoría propuesta y ofrecer al usuario elegir entre `Salidas`, `Comida` y `Extras`, quedando confirmado por la vía de corrección.

### Requisito 8 — Imputación mensual y cuotas

**Historia de usuario:** Como usuario, quiero que una compra en cuotas impacte en cada mes en que
efectivamente la pago, para que el gráfico refleje mi flujo de caja real.

**Criterios de aceptación:**

8.1. WHEN un gasto queda extraído y normalizado THE SYSTEM SHALL generar exactamente tantas imputaciones como cuotas tenga la compra.
8.2. THE SYSTEM SHALL asignar a la imputación número N el mes calendario que resulta de sumar N menos uno meses al mes de la fecha del gasto.
8.3. THE SYSTEM SHALL garantizar que la suma de los montos de las imputaciones de un gasto sea exactamente igual al monto total de ese gasto.
8.4. THE SYSTEM SHALL representar el mes de cada imputación en formato `AAAA-MM`, calculado sobre la fecha del gasto en la zona horaria de referencia.
8.5. THE SYSTEM SHALL generar una única imputación tanto para un gasto de débito como para un gasto de crédito en una sola cuota, sin tratarlos como casos distintos.
8.6. IF ya existe una imputación para la misma combinación de gasto y número de cuota THEN THE SYSTEM SHALL no crear un duplicado.
8.7. WHEN un paso del pipeline se ejecuta más de una vez sobre el mismo gasto THE SYSTEM SHALL producir el mismo resultado que en su primera ejecución.
8.8. WHEN un aviso corresponde a una compra en más de una cuota THE SYSTEM SHALL interpretar el campo `Monto` del aviso como el valor de una sola cuota y obtener el monto total del gasto multiplicándolo por la cantidad de cuotas.

### Requisito 9 — Dashboard de gastos por mes

**Historia de usuario:** Como usuario, quiero ver un gráfico de mis gastos por mes y por categoría, para
entender en qué se me va la plata sin abrir el homebanking.

**Criterios de aceptación:**

9.1. THE SYSTEM SHALL calcular el total de cada mes sumando imputaciones y nunca sumando gastos.
9.2. WHEN el usuario abre el dashboard THE SYSTEM SHALL mostrar un gráfico de gastos por mes desagregado por categoría.
9.3. WHERE un gasto tiene categoría de origen `ia` y sin confirmar THE SYSTEM SHALL incluir sus imputaciones en los totales del mes y presentarlas con un indicador visual de "sin confirmar".
9.4. WHEN el usuario corrige la categoría de un gasto THE SYSTEM SHALL reflejar el cambio en todas las imputaciones de ese gasto sin alterar sus montos ni sus meses.
9.5. WHERE un gasto está en estado `needs_review` THE SYSTEM SHALL excluirlo de los totales del dashboard.

### Requisito 10 — Errores, reintentos y reprocesamiento

**Historia de usuario:** Como usuario, quiero que una falla puntual no me haga perder un gasto ni me
invente un número, para poder confiar en los totales.

**Criterios de aceptación:**

10.1. WHEN un paso del pipeline falla por una causa transitoria THE SYSTEM SHALL reintentarlo con espera creciente entre intentos.
10.2. IF un paso agota sus reintentos THEN THE SYSTEM SHALL dejar el gasto en estado `needs_review` y conservar intacto el email crudo que lo originó.
10.3. THE SYSTEM SHALL permitir reprocesar un email crudo ya almacenado sin volver a consultarlo en Gmail.
10.4. THE SYSTEM SHALL registrar, para cada gasto, el paso en el que se encuentra y el último error ocurrido, si hubo alguno.
10.5. THE SYSTEM SHALL mantener los estados de un gasto dentro del conjunto `pendiente`, `extraido`, `categorizado`, `imputado` y `needs_review`.

## Fuera de alcance

- **Fecha de cierre de la tarjeta.** La primera cuota se imputa al mes de la compra. En la realidad,
  una compra posterior al cierre cae recién en el resumen siguiente; ese ajuste queda para un spec
  posterior y no altera el modelo de datos.
- **Fallback de extracción con IA.** Si el parser falla, el gasto va a `needs_review`. Delegar la
  extracción a un modelo cuando cambie el template del banco queda explícitamente afuera de esta versión.
- **Devoluciones, reversas y contracargos.** No se modelan avisos de reintegro ni anulaciones.
- **Transferencias y débitos automáticos.** Solo se procesan avisos de consumo con tarjeta.
- **Otros bancos y otros remitentes.** Un único remitente configurado.
- **Multi-moneda.** Solo pesos argentinos; no hay conversión ni consumos en dólares.
- **Multi-usuario.** Una sola casilla y un solo conjunto de reglas.
- **Presupuestos, límites y alertas de consumo.**
- **Exportación de datos y reportes descargables.**
- **Notificaciones fuera de la aplicación** (email, push, mensajería).
- **La pantalla `/revision`** (decisión del 2026-08-26). Esta versión construye dos superficies:
  `/dashboard` y `/bandeja`. Queda explícitamente afuera todo lo que era propio de esa tercera
  pantalla: la lista de gastos en `needs_review`, el acceso al email crudo desde la interfaz, la
  sección "Errores del sistema" y el formulario de carga manual que retomaba el pipeline desde la
  categorización.
  **Lo que NO sale con ella:** el estado `needs_review` sigue existiendo (10.2, 10.5), esos gastos
  siguen excluidos de los totales (9.5), el email crudo se sigue conservando intacto, y el paso y el
  último error se siguen registrando por gasto (10.4). Lo que se corta es la **superficie**, no el
  modelo. Cuando la pantalla se construya en un spec posterior, el dato ya va a estar ahí.
  **Costo aceptado:** sin esa pantalla, un gasto que falla la extracción es invisible dentro de la
  aplicación y el total del mes lo subestima sin avisar. La recuperación existe pero es de operador,
  no de usuario: reprocesar el email crudo ya almacenado (10.3).

## Decisiones resueltas

- **El campo `Monto` en una compra en cuotas es el valor de una sola cuota** (resuelto el 2026-08-26 por
  el usuario). El monto total del gasto se obtiene multiplicándolo por la cantidad de cuotas —
  criterio 8.8.
- **El modelo puede abstenerse.** Un comercio que la IA no reconoce con confianza no recibe una
  categoría inventada: queda en `Sin categorizar` y la elección es del usuario en la bandeja —
  criterios 6.1, 6.7 y 7.10.
- **Lista inicial de comercios por categoría aportada** (2026-08-26). Se siembra como reglas activas de
  origen `usuario`; el detalle vive en `design.md` — criterio 5.8.

## Preguntas abiertas

- ¿Se necesita distinguir en la bandeja un gasto que el modelo no supo categorizar de uno cuya
  inferencia falló por error técnico? Hoy los tres caminos (respuesta fuera del enum, falla del modelo
  y `no_estoy_seguro`) confluyen en `Sin categorizar`; la justificación persistida los distingue.
- ¿Se necesita permitir editar la categoría de un gasto ya confirmado desde el dashboard, o alcanza con
  hacerlo desde la bandeja antes de confirmar?
