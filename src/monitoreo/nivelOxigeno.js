// Color del oxígeno, en sintonía con las alertas que manda el backend (monitoreo):
// toma la alerta más grave de la respuesta.
// - sin alertas o solo 'info' ("conviene revisar el oxígeno") → 'normal'  (blanco)
// - 'aviso' (ya no cubre el margen de regreso ni la reserva)   → 'aviso'   (amarillo)
// - 'critico' (no alcanza para volver)                          → 'critico' (rojo)
// Así el número y la alerta en pantalla siempre dicen lo mismo.
export function nivelOxigeno(m) {
  const niveles = (m?.alertas ?? []).map((a) => a.nivel)
  if (niveles.includes('critico')) return 'critico'
  if (niveles.includes('aviso')) return 'aviso'
  return 'normal'
}
