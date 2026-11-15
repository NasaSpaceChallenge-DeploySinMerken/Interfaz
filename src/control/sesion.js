// Código de sesión de esta demo para el control desde el teléfono.
// Uno por pestaña: el teléfono sigue emparejado entre la planificación y la caminata.
//
// Con el servidor propio, el código lo entrega el servidor (POST /control/reservar),
// que nunca da el mismo a dos demos abiertas. main.jsx espera esa respuesta antes de
// dibujar la app, así todos leen ya el código definitivo. Sin servidor propio
// (npm run dev) o si el pedido falla, queda un código al azar.

import { CONTROL, esControlRemoto, nuevoCodigo } from './canal'

export let CODIGO_SESION = nuevoCodigo()

export async function reservarCodigo() {
  if (import.meta.env.VITE_SERVIDOR !== 'propio' || esControlRemoto()) return
  try {
    const r = await fetch(`${CONTROL}/reservar`, { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(4000) })
    if (!r.ok) return
    const { codigo } = await r.json()
    if (/^\d{4}$/.test(codigo)) CODIGO_SESION = codigo
  } catch {
    // sin respuesta: se queda el código al azar
  }
}
