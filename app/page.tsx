import { redirect } from 'next/navigation'

// La raíz no tiene pantalla propia: `/dashboard` es la única entrada de la app.
export default function PaginaRaiz() {
  redirect('/dashboard')
}
