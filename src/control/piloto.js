// Un solo piloto a la vez.
//
// Varias personas pueden abrir el control de la misma demo (por ejemplo, leyendo
// el QR). La demo obedece solo a una: el piloto. Los demás quedan en modo
// espectador: ven el viaje en su teléfono, pero la demo ignora sus órdenes.
//
// - El primer control que pide el control lo obtiene.
// - El piloto avisa que sigue ahí con un 'hola' cada 1 s. Si deja de llegar
//   durante LIBERAR_MS (cerró la página, perdió la señal), el control queda libre.
// - El piloto puede soltarlo ({ tipo: 'soltar' }).
// - Un espectador manda 'hola' con `pide: false`: no toma el control solo.
//   Cuando lo ve libre, puede pedirlo (botón "Tomar el control" → `pide: true`).
//
// El estado vive en el módulo (uno por pestaña de la demo), así el piloto sigue
// siéndolo al pasar de la planificación a la caminata.

const LIBERAR_MS = 5000

let piloto = null // { id, ultimo }

function vigente() {
  if (piloto && Date.now() - piloto.ultimo > LIBERAR_MS) piloto = null
  return piloto
}

// ¿La demo debe obedecer este mensaje del control?
export function admitir(msg) {
  const id = msg.emisor ?? 'sin-id'
  vigente()
  if (msg.tipo === 'soltar') {
    if (piloto?.id === id) piloto = null
    return false
  }
  if (!piloto) {
    if (msg.tipo === 'hola' && msg.pide === false) return false
    piloto = { id, ultimo: Date.now() }
  }
  if (piloto.id !== id) return false
  piloto.ultimo = Date.now()
  return true
}

// id del piloto actual (o null si el control está libre); va en el estado que
// la demo manda a los teléfonos, para que cada uno sepa si es el piloto
export const pilotoActual = () => vigente()?.id ?? null
