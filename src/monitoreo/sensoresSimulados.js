// Simulación del astronauta y de los sensores del traje.
//
// En la demo no hay traje real: esto mueve al astronauta e inventa las lecturas
// de los sensores. Cada segundo, useMonitoreo lee el estado y lo manda al backend.
//
// Dos modos de control:
// - 'auto': el astronauta sigue la ruta que devolvió el backend.
// - 'manual': se mueve con teclado, cruceta en pantalla o joystick. Puede salir
//   de la ruta, pero no del tramo de la demo. Una parada se da por alcanzada al
//   pasar a menos de LLEGADA_M metros.

import { distancia, dentroDe, rad, rumbo, RADIO_MARTE } from '../mapa/geo'
import { TRAMO } from '../datos/gale'

const VEL_M_S = 1.0 // velocidad de caminata con traje
const O2_POR_MIN = 0.3 // consumo real, algo mayor al estimado en la planificación
const LLEGADA_M = 25
const PASO_RASTRO_M = 5

const onda = (t, periodo) => Math.sin((2 * Math.PI * t) / periodo)
const redondear = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d

// mueve un punto `metros` hacia la dirección (x: este, y: norte), con |(x, y)| = 1
function desplazar(p, x, y, metros) {
  const dLat = ((y * metros) / RADIO_MARTE) * (180 / Math.PI)
  const dLon = ((x * metros) / (RADIO_MARTE * Math.cos(rad(p.lat)))) * (180 / Math.PI)
  return { lon: p.lon + dLon, lat: p.lat + dLat }
}

export function crearSensoresSimulados(viaje) {
  const camino = viaje.respuesta.ruta.coordinates.map(([lon, lat]) => ({ lon, lat }))
  const acumulado = [0]
  for (let i = 1; i < camino.length; i++) acumulado.push(acumulado[i - 1] + distancia(camino[i - 1], camino[i]))
  const total = acumulado[acumulado.length - 1]

  // dónde cae cada punto a visitar sobre la ruta (metros desde el inicio)
  const verticeMasCercano = (p) => {
    let mejor = 0, dmin = Infinity
    camino.forEach((q, i) => { const d = distancia(p, q); if (d < dmin) { dmin = d; mejor = i } })
    return mejor
  }
  const paradas = viaje.puntos.map((p) => ({ ...p, metros: acumulado[verticeMasCercano(p)] }))
  if (viaje.volver) paradas.push({ id: 'aterrizaje', nombre: 'Aterrizaje', ...viaje.aterrizaje, metros: total })

  function posicionEn(d) {
    let i = 1
    while (i < acumulado.length - 1 && acumulado[i] < d) i++
    const a = camino[i - 1], b = camino[i] ?? a
    const largo = acumulado[i] - acumulado[i - 1]
    const f = largo ? (d - acumulado[i - 1]) / largo : 0
    return { pos: { lon: a.lon + (b.lon - a.lon) * f, lat: a.lat + (b.lat - a.lat) * f }, rumbo: rumbo(a, b) }
  }

  let t, modo = 'auto', avance, odometro, pos, rumboActual, siguiente, rastro, fueraDeZona

  function reiniciar() {
    t = 0
    avance = 0
    odometro = 0
    pos = { ...camino[0] }
    rumboActual = posicionEn(0).rumbo
    siguiente = 0
    rastro = [{ ...pos }]
    fueraDeZona = false
  }
  reiniciar()

  function actualizarSiguiente() {
    if (modo === 'auto') {
      while (siguiente < paradas.length && avance >= paradas[siguiente].metros - 0.5) siguiente++
    } else {
      while (siguiente < paradas.length && distancia(pos, paradas[siguiente]) <= LLEGADA_M) siguiente++
    }
  }

  const terminado = () => siguiente >= paradas.length

  return {
    total,
    paradas,
    camino,

    // Avanza la simulación `segundos` segundos.
    // En modo manual, `direccion` = { x: este, y: norte } (o null si no se mueve).
    avanzar(segundos, direccion = null) {
      if (terminado()) return
      t += segundos
      const metros = segundos * VEL_M_S

      if (modo === 'auto') {
        const antes = avance
        avance = Math.min(total, avance + metros)
        odometro += avance - antes
        const r = posicionEn(avance)
        pos = r.pos
        rumboActual = r.rumbo
      } else if (direccion && (direccion.x || direccion.y)) {
        // con un joystick analógico, inclinar menos = caminar más lento
        const largo = Math.hypot(direccion.x, direccion.y)
        const x = direccion.x / largo, y = direccion.y / largo
        const nueva = desplazar(pos, x, y, metros * Math.min(1, largo))
        rumboActual = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360
        fueraDeZona = !dentroDe(TRAMO, nueva)
        if (!fueraDeZona) {
          pos = nueva
          odometro += metros * Math.min(1, largo)
        }
      }

      const ultimo = rastro[rastro.length - 1]
      if (distancia(ultimo, pos) >= PASO_RASTRO_M) rastro.push({ ...pos })
      actualizarSiguiente()
    },

    cambiarModo(nuevo) {
      if (nuevo === modo) return
      if (nuevo === 'auto') {
        // vuelve a la ruta en el punto más cercano y sigue desde ahí
        const i = verticeMasCercano(pos)
        avance = acumulado[i]
        pos = { ...camino[i] }
        rastro.push({ ...pos })
        siguiente = paradas.findIndex((p) => p.metros > avance)
        if (siguiente === -1) siguiente = paradas.length
      }
      fueraDeZona = false
      modo = nuevo
    },

    reiniciar,

    leer() {
      const proxima = paradas[siguiente] ?? null
      const faltaProxima = proxima ? (modo === 'auto' ? proxima.metros - avance : distancia(pos, proxima)) : 0
      const restante = proxima ? (modo === 'auto' ? total - avance : faltaProxima + (total - proxima.metros)) : 0
      return {
        t,
        modo,
        recorrido: odometro,
        restante,
        total,
        terminado: terminado(),
        fueraDeZona,
        posicion: { lon: +pos.lon.toFixed(6), lat: +pos.lat.toFixed(6) },
        rumbo: rumboActual,
        rastro: [...rastro, pos],
        proxima: proxima && { nombre: proxima.nombre, faltaM: faltaProxima },
        sensores: {
          oxigenoPct: redondear(Math.max(0, 100 - O2_POR_MIN * (t / 60))),
          temperaturaTraje: redondear(22 + 11 * onda(t, 2400)),
          temperaturaExterior: redondear(-60 + 20 * onda(t, 7200)),
          pulso: Math.round(100 + 35 * onda(t, 900) + 6 * onda(t, 37)),
          spo2: Math.round(97 - 5 * Math.max(0, onda(t, 1300))),
        },
      }
    },
  }
}
