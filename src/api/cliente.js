// Cliente del backend. El formato está en Contrato_API.md.
//
// Sin VITE_API_URL usa el backend falso de mock.js, así se puede trabajar
// sin esperar al equipo del backend.

import * as mock from './mock'

const API = import.meta.env.VITE_API_URL

export const usaBackendFalso = !API

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...opciones.headers },
  })
  if (!respuesta.ok) {
    let mensaje = `El backend respondió ${respuesta.status}`
    try {
      mensaje = (await respuesta.json()).error ?? mensaje
    } catch {
      // la respuesta no era JSON
    }
    const error = new Error(mensaje)
    error.status = respuesta.status
    throw error
  }
  return respuesta.json()
}

// Fase 1: capas disponibles para el mapa.
export function obtenerCapas() {
  if (!API) return mock.obtenerCapas()
  return pedir('/api/capas')
}

// Fase 1: manda el aterrizaje y los puntos a visitar, devuelve la ruta y sus métricas.
export function planificarRuta({ aterrizaje, puntos, volver }) {
  if (!API) return mock.planificarRuta({ aterrizaje, puntos, volver })
  return pedir('/api/rutas', { method: 'POST', body: JSON.stringify({ aterrizaje, puntos, volver }) })
}

// Fase 2: manda posición y sensores, devuelve las alertas activas.
export function enviarMonitoreo({ idRuta, t, posicion, sensores }) {
  if (!API) return mock.enviarMonitoreo({ idRuta, t, posicion, sensores })
  return pedir('/api/monitoreo', { method: 'POST', body: JSON.stringify({ idRuta, t, posicion, sensores }) })
}
