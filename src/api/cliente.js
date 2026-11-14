// Cliente del backend (Juan). El formato está en Contrato_API.md.
//
// Sin VITE_API_URL usa el backend falso de mock.js, así podemos trabajar
// sin esperar al equipo del backend.

import * as mock from './mock'

const API = import.meta.env.VITE_API_URL

// Fase 1: capas disponibles para el mapa.
export async function obtenerCapas() {
  if (!API) return mock.obtenerCapas()
  // TODO (Juan): GET ${API}/api/capas
  throw new Error('Sin implementar')
}

// Fase 1: manda el aterrizaje y los puntos a visitar, devuelve la ruta y sus métricas.
export async function planificarRuta({ aterrizaje, puntos }) {
  if (!API) return mock.planificarRuta({ aterrizaje, puntos })
  // TODO (Juan): POST ${API}/api/rutas. Si responde 422, mostrar el mensaje de error.
  throw new Error('Sin implementar')
}

// Fase 2: manda posición y sensores, devuelve las alertas activas.
export async function enviarMonitoreo({ idRuta, t, posicion, sensores }) {
  if (!API) return mock.enviarMonitoreo({ idRuta, t, posicion, sensores })
  // TODO (Juan): POST ${API}/api/monitoreo
  throw new Error('Sin implementar')
}
