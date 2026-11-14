// Reglas de temperatura (P2 — Pamela).
// Mismo formato que reglas/oxigeno.js.

export const RANGOS_TRAJE = {
  aviso: { min: 18, max: 27 }, // °C: fuera de este rango → aviso
  critico: { min: 10, max: 35 }, // °C: fuera de este rango → crítico
}

export function reglaTemperatura({ temperatura }) {
  const alertas = []

  // TODO (Pamela): alerta 'temperatura-traje' (aviso o crítico) según RANGOS_TRAJE.
  // TODO (Pamela): temperatura exterior solo como 'info'.
  void temperatura

  return alertas
}
