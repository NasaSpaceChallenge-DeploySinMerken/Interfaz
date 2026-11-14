// Sensores simulados del traje.
//
// En la demo no hay traje real: esto mueve al astronauta por la ruta que devolvió
// el backend e inventa las lecturas de los sensores. Los valores oscilan a
// propósito para que el backend tenga motivos para mandar alertas.

import { distancia, rumbo } from '../mapa/geo'

const VEL_M_S = 1.0 // velocidad de caminata con traje
const O2_POR_MIN = 0.3 // consumo real, algo mayor al estimado en la planificación

const onda = (t, periodo) => Math.sin((2 * Math.PI * t) / periodo)
const redondear = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d

export function crearSensoresSimulados(viaje) {
  const camino = viaje.respuesta.ruta.coordinates.map(([lon, lat]) => ({ lon, lat }))
  const acumulado = [0]
  for (let i = 1; i < camino.length; i++) acumulado.push(acumulado[i - 1] + distancia(camino[i - 1], camino[i]))
  const total = acumulado[acumulado.length - 1]

  // metros desde el inicio en que se llega a cada punto a visitar
  const paradas = viaje.puntos.map((p) => {
    let mejor = 0, dmin = Infinity
    camino.forEach((q, i) => { const d = distancia(p, q); if (d < dmin) { dmin = d; mejor = i } })
    return { ...p, metros: acumulado[mejor] }
  })
  if (viaje.volver) paradas.push({ id: 'aterrizaje', nombre: 'Aterrizaje', ...viaje.aterrizaje, metros: total })

  let t = 0
  let recorrido = 0

  function posicionEn(d) {
    let i = 1
    while (i < acumulado.length - 1 && acumulado[i] < d) i++
    const a = camino[i - 1], b = camino[i]
    const largo = acumulado[i] - acumulado[i - 1]
    const f = largo ? (d - acumulado[i - 1]) / largo : 0
    const pos = { lon: a.lon + (b.lon - a.lon) * f, lat: a.lat + (b.lat - a.lat) * f }
    return { pos, indice: i - 1, rumbo: rumbo(a, b) }
  }

  return {
    total,
    paradas,
    camino,

    avanzar(segundos) {
      if (recorrido >= total) return
      t += segundos
      recorrido = Math.min(total, recorrido + segundos * VEL_M_S)
    },

    reiniciar() {
      t = 0
      recorrido = 0
    },

    leer() {
      const { pos, indice, rumbo: r } = posicionEn(recorrido)
      const minutos = t / 60
      const proxima = paradas.find((p) => p.metros > recorrido + 1) ?? null
      return {
        t,
        recorrido,
        total,
        terminado: recorrido >= total,
        posicion: { lon: +pos.lon.toFixed(6), lat: +pos.lat.toFixed(6) },
        indice,
        rumbo: r,
        proxima: proxima && { nombre: proxima.nombre, faltaM: proxima.metros - recorrido },
        sensores: {
          oxigenoPct: redondear(Math.max(0, 100 - O2_POR_MIN * minutos)),
          temperaturaTraje: redondear(22 + 11 * onda(t, 2400)),
          temperaturaExterior: redondear(-60 + 20 * onda(t, 7200)),
          pulso: Math.round(100 + 35 * onda(t, 900) + 6 * onda(t, 37)),
          spo2: Math.round(97 - 5 * Math.max(0, onda(t, 1300))),
        },
      }
    },
  }
}
