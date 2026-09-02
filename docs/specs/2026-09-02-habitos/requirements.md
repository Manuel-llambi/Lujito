# Requisitos — Hábitos

**Estado:** Borrador
**Fecha:** 2026-09-02
**Autor:** Manuel

## Introducción

El dashboard actual muestra cuánto se gastó, pero no dice nada sobre el patrón detrás de ese número. Esta
feature agrega una pantalla `/habitos`, accesible desde una tercera pestaña en la navegación inferior, que
analiza las imputaciones ya existentes y presenta hallazgos sobre el comportamiento de gasto del usuario —
qué categoría domina el mes, cómo varió cada categoría respecto al mes anterior, si el ritmo de gasto
proyecta cerrar por encima o por debajo de lo habitual, y qué comercios se repiten — junto con una
recomendación asociada a cada hallazgo.

El valor está en convertir datos que ya existen en observaciones legibles, sin pedirle al usuario que
interprete un gráfico. Los hallazgos y las recomendaciones los decide siempre un cálculo determinístico
sobre los datos; un modelo de lenguaje se usa únicamente para redactar el texto final en un tono más
natural, nunca para decidir el hallazgo, el monto o la recomendación.

## Glosario

Reutiliza el glosario de `docs/specs/2026-08-25-pipeline-gastos-email/requirements.md` (gasto, imputación,
categoría, comercio, zona horaria de referencia). Términos nuevos de esta feature:

- **Mes en foco** — el mes calendario más reciente que tiene al menos una imputación. `/habitos` siempre
  analiza este mes; no existe selector de mes.
- **Hallazgo** — una observación calculada sobre el mes en foco (categoría dominante, variación por
  categoría, ritmo de gasto proyectado, o comercio recurrente).
- **Recomendación** — una sugerencia de acción, derivada 1:1 de un hallazgo por la misma regla que lo
  calculó.
- **Texto de respaldo** — el texto determinístico (template string) que acompaña a cada hallazgo y
  recomendación desde el momento en que se calculan, y que se muestra si la redacción con el modelo no
  está disponible.
- **Comercio recurrente** — un comercio (por su texto normalizado, ver criterio 5.7 del spec de pipeline)
  que aparece en dos o más gastos dentro del mes en foco.

## Requisitos

### Requisito 1 — Acceso a Hábitos desde la navegación inferior

**Historia de usuario:** Como usuario, quiero una pestaña "Hábitos" en la barra de navegación inferior,
para llegar a mis hallazgos sin salir del flujo habitual de la app.

**Criterios de aceptación:**

1.1. WHEN el usuario toca la pestaña "Hábitos" de la barra de navegación inferior THE SYSTEM SHALL navegar a `/habitos`.
1.2. WHILE el usuario está en `/habitos` THE SYSTEM SHALL mostrar la pestaña "Hábitos" de la barra de navegación inferior como activa.
1.3. THE SYSTEM SHALL mostrar en `/habitos` la misma barra de navegación inferior con las pestañas "Inicio" y "Bandeja" ya existentes, sin alterar su comportamiento.

### Requisito 2 — Cálculo de hallazgos sobre el mes en foco

**Historia de usuario:** Como usuario, quiero ver hallazgos calculados automáticamente sobre mis gastos más
recientes, para entender mis hábitos sin tener que elegir un mes ni interpretar un gráfico.

**Criterios de aceptación:**

2.1. WHEN el usuario abre `/habitos` THE SYSTEM SHALL calcular los hallazgos sobre el mes en foco.
2.2. IF no existe ninguna imputación en el sistema THEN THE SYSTEM SHALL no calcular ningún hallazgo.
2.3. WHEN el mes en foco tiene al menos una imputación con categoría asignada THE SYSTEM SHALL calcular el hallazgo de categoría dominante como la categoría cuyo total imputado en el mes en foco sea el más alto.
2.4. IF dos o más categorías empatan en el total más alto del mes en foco THEN THE SYSTEM SHALL no calcular el hallazgo de categoría dominante.
2.5. WHEN existe al menos un mes calendario anterior al mes en foco con imputaciones THE SYSTEM SHALL calcular, para cada categoría con imputaciones en el mes en foco o en el mes anterior, la variación porcentual entre el total imputado de esa categoría en ambos meses.
2.6. IF no existe un mes calendario anterior al mes en foco con imputaciones THEN THE SYSTEM SHALL no calcular el hallazgo de variación por categoría.
2.7. WHEN existen al menos dos meses calendario anteriores al mes en foco con imputaciones THE SYSTEM SHALL calcular el hallazgo de ritmo de gasto proyectado, comparando el total imputado en el mes en foco hasta el día actual contra el promedio del total imputado hasta ese mismo día del mes en los meses anteriores disponibles.
2.8. IF no existen al menos dos meses calendario anteriores al mes en foco con imputaciones THEN THE SYSTEM SHALL no calcular el hallazgo de ritmo de gasto.
2.9. WHEN dentro del mes en foco existen dos o más gastos del mismo comercio normalizado THE SYSTEM SHALL calcular el hallazgo de comercio recurrente con la cantidad de gastos y el total imputado de ese comercio.
2.10. IF ningún comercio se repite dentro del mes en foco THEN THE SYSTEM SHALL no calcular el hallazgo de comercio recurrente.
2.11. IF un gasto no tiene comercio registrado THEN THE SYSTEM SHALL excluirlo del cálculo de comercios recurrentes.
2.12. THE SYSTEM SHALL calcular cada uno de los cuatro hallazgos de forma independiente, de modo que la imposibilidad de calcular uno no impida calcular los demás.

### Requisito 3 — Recomendación derivada de cada hallazgo

**Historia de usuario:** Como usuario, quiero que cada hallazgo venga con una sugerencia concreta, para
saber qué hacer con la información y no solo leerla.

**Criterios de aceptación:**

3.1. WHEN THE SYSTEM calcula un hallazgo THE SYSTEM SHALL calcular junto con él una recomendación determinística, definida por la misma regla que calculó el hallazgo.
3.2. THE SYSTEM SHALL no calcular una recomendación para un hallazgo que no fue calculado.

### Requisito 4 — Redacción con IA y respaldo determinístico

**Historia de usuario:** Como usuario, quiero leer los hallazgos y recomendaciones en un texto natural, sin
que una falla del redactor me deje la pantalla vacía o rota.

**Criterios de aceptación:**

4.1. THE SYSTEM SHALL calcular un texto de respaldo determinístico para cada hallazgo y cada recomendación en el mismo momento en que se calculan, antes de solicitar cualquier redacción al modelo.
4.2. WHEN existe al menos un hallazgo calculado THE SYSTEM SHALL solicitar al modelo una redacción en lenguaje natural del texto de cada hallazgo y de su recomendación.
4.3. IF la solicitud de redacción al modelo falla o no responde dentro del tiempo límite configurado THEN THE SYSTEM SHALL mostrar el texto de respaldo de ese hallazgo o recomendación en lugar del texto del modelo.
4.4. THE SYSTEM SHALL resolver la redacción de cada hallazgo y recomendación de forma independiente, de modo que la falla de uno no impida mostrar el texto redactado de los demás.
4.5. THE SYSTEM SHALL no permitir que el texto redactado por el modelo modifique el valor numérico, la categoría o el comercio de un hallazgo ya calculado.
4.6. THE SYSTEM SHALL redactar el texto de cada hallazgo y recomendación, tanto el generado por el modelo como el texto de respaldo, en tono informal con modismos argentinos rioplatenses (voseo, expresiones coloquiales), consistente con la variante de español ya usada en la aplicación.

### Requisito 5 — Presentación en dos secciones

**Historia de usuario:** Como usuario, quiero ver los hallazgos separados de las recomendaciones, para
distinguir de un vistazo qué pasó de qué puedo hacer al respecto.

**Criterios de aceptación:**

5.1. WHEN existe al menos un hallazgo calculado THE SYSTEM SHALL mostrar en `/habitos` una sección "Hallazgos" con una tarjeta por cada hallazgo calculado.
5.2. WHEN existe al menos una recomendación calculada THE SYSTEM SHALL mostrar en `/habitos` una sección "Recomendaciones" con una tarjeta por cada recomendación calculada.
5.3. THE SYSTEM SHALL mostrar cada tarjeta de hallazgo y de recomendación con los mismos patrones visuales (bordes, tipografía, color de superficie) que ya usan las tarjetas de `/dashboard`.

### Requisito 6 — Estado vacío por datos insuficientes

**Historia de usuario:** Como usuario nuevo, quiero un mensaje claro si todavía no hay suficiente historial,
para no ver una pantalla en blanco sin explicación.

**Criterios de aceptación:**

6.1. IF ningún hallazgo pudo calcularse para el mes en foco THEN THE SYSTEM SHALL mostrar en `/habitos` un mensaje explícito indicando que todavía no hay datos suficientes, en lugar de las secciones "Hallazgos" y "Recomendaciones".
6.2. WHILE se muestra el mensaje de datos insuficientes THE SYSTEM SHALL seguir mostrando la barra de navegación inferior con la pestaña "Hábitos" activa.

## Fuera de alcance

- **Selector de mes.** `/habitos` siempre analiza el mes en foco; navegar a meses anteriores queda para un
  spec posterior si hace falta.
- **Gráfico o mini-visualización de tendencia.** La comparación entre meses se comunica en texto dentro de
  los hallazgos, no con un elemento visual nuevo.
- **Persistencia o caché de hallazgos.** Se calculan on-demand en cada visita; no hay tabla `hallazgos` ni
  job periódico.
- **El modelo decidiendo el hallazgo o la recomendación.** El modelo redacta texto a partir de datos ya
  calculados; nunca elige qué mostrar ni qué monto usar.
- **Notificaciones o alertas fuera de la pantalla** (email, push, badge en el navbar).
- **Configuración de umbrales por el usuario** (ej. elegir a partir de qué porcentaje se considera una
  variación relevante). Los umbrales quedan fijados en el diseño.

## Preguntas abiertas

Ninguna — el diseño previo en `/brainstorming` resolvió las decisiones de arquitectura, origen de los
hallazgos y manejo de errores. `design.md` define los valores concretos de umbral y timeout.
