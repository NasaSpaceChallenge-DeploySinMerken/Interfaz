// Color del oxígeno según lo que manda el backend (monitoreo):
// T = oxígeno en el tanque, R = oxígeno para volver al aterrizaje, X = reserva.
// - 'normal'  (blanco):   T ≥ X + 2·R   sobra para volver dos veces y guardar la reserva
// - 'aviso'   (amarillo): T < X + 2·R   queda poco (coincide con la alerta "info" del backend)
// - 'critico' (rojizo):   T < X + R     volver ya obliga a usar la reserva
export function nivelOxigeno(m) {
  if (!m || m.oxigenoRestanteG == null || m.costoRegresoG == null) return 'normal'
  const t = m.oxigenoRestanteG
  const r = m.costoRegresoG
  const x = m.reservaG ?? 0
  if (t < x + r) return 'critico'
  if (t < x + 2 * r) return 'aviso'
  return 'normal'
}
