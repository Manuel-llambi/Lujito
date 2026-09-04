import { readFileSync, existsSync } from 'node:fs'
import { Pool } from 'pg'
import { aplicarMigraciones } from './migrar.ts'

/**
 * CLI para aplicar `infra/db/migraciones/*.sql` contra la base real (`DATABASE_URL`), no contra el
 * Postgres efímero que usan los tests (`testUtils/basePostgresDeTest.ts`). Hasta la migración
 * "Descartar" (trabajo ad hoc, fuera de tasks.md), `aplicarMigraciones` solo se invocaba desde
 * tests — no existía ninguna forma commiteada de correrla contra la base real, así que cada migración
 * nueva quedaba en el repo sin aplicarse hasta que alguien la corriera a mano. Reutiliza
 * `aplicarMigraciones`: este archivo no reimplementa la lógica de aplicar/trackear migraciones, solo
 * le da un `Pool` real y reporta qué quedó aplicado.
 *
 * No usa `node --env-file=.env.local` (la forma obvia) porque ese flag no le saca el BOM (Byte Order
 * Mark) a `.env.local` si el archivo lo tiene: la primera variable del archivo queda registrada como
 * `﻿DATABASE_URL` en vez de `DATABASE_URL`, y `pg.Pool` termina conectando contra el
 * `localhost:5432` por defecto en lugar de la base real (síntoma real observado: `ECONNREFUSED` sin
 * ningún error de autenticación). `next dev` no tiene este problema porque su loader de env
 * (`@next/env`) sí limpia el BOM. Esta carga manual es minimalista a propósito —no agrega `dotenv`
 * como dependencia nueva— y una variable ya presente en el entorno real siempre gana sobre
 * `.env.local`, mismo orden de precedencia que usa `next dev`.
 */
function cargarEnvLocal(): void {
  const ruta = '.env.local'
  if (!existsSync(ruta)) {
    return
  }
  const contenido = readFileSync(ruta, 'utf-8').replace(/^﻿/, '')
  for (const linea of contenido.split('\n')) {
    const limpia = linea.trim()
    if (limpia === '' || limpia.startsWith('#')) {
      continue
    }
    const separador = limpia.indexOf('=')
    if (separador === -1) {
      continue
    }
    const clave = limpia.slice(0, separador).replace(/^export\s+/, '').trim()
    let valor = limpia.slice(separador + 1).trim()
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1)
    }
    if (process.env[clave] === undefined) {
      process.env[clave] = valor
    }
  }
}

async function main(): Promise<void> {
  cargarEnvLocal()

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await aplicarMigraciones(pool)
    const { rows } = await pool.query<{ nombre: string }>(
      'SELECT nombre FROM _migraciones_aplicadas ORDER BY nombre',
    )
    console.log('Migraciones aplicadas contra la base real:')
    for (const fila of rows) {
      console.log(`  - ${fila.nombre}`)
    }
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('aplicarMigracionesCli: falló la migración —', error)
  process.exitCode = 1
})
