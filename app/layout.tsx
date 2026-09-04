import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Finanzas Cumzi',
  description: 'Pipeline de gastos desde emails del banco',
}

/**
 * El indicador de pendientes (Req. 7.1) se muestra una única vez, sobre el ícono de "Bandeja" en
 * `BottomNavBar` — no acá. El layout raíz solía dibujar una segunda copia en un `<header>` propio;
 * quedaba duplicado con el del navbar (revisión visual/UX). Al sacarlo, este layout deja de necesitar
 * la conexión a base de datos y vuelve a poder ser estático.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
