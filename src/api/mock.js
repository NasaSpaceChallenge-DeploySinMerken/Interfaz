// Backend falso (Juan). Responde con el formato de Contrato_API.md.

export async function obtenerCapas() {
  // TODO (Juan): devolver las capas de ejemplo del contrato.
  return []
}

export async function planificarRuta({ aterrizaje, puntos }) {
  // TODO (Juan): devolver una ruta de ejemplo que pase por los puntos,
  // con métricas inventadas.
  void aterrizaje
  void puntos
  return { idRuta: 'mock', ruta: { type: 'LineString', coordinates: [] }, metricas: {}, tramos: [] }
}

export async function enviarMonitoreo({ sensores }) {
  // TODO (Juan): devolver alertas según los sensores, para probar la pantalla
  // (las reglas de verdad están en el backend).
  void sensores
  return { alertas: [] }
}
