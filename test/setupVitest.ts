// Matchers de jest-dom (toHaveTextContent, etc.) para los tests de componentes de T42 en adelante.
// Colocado en `test/` siguiendo la convención de T1: `test/` es donde vive lo que no es un módulo de
// dominio/infra/workflow/app propio, sino andamiaje de test compartido.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Limpieza explícita del DOM entre tests (T42, Decision log): el auto-cleanup de
// `@testing-library/react` depende de detectar un `afterEach` global, y `test.globals` está apagado
// en este proyecto (los tests importan `describe`/`it`/`afterEach` explícitos de `vitest`). Sin esto,
// dos tests que renderizan el mismo `data-testid` en archivos o `it` distintos chocan entre sí.
afterEach(() => {
  cleanup()
})
