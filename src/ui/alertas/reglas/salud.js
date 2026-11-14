// Reglas de salud (P3 — Pamela).
// Mismo formato que reglas/oxigeno.js.

export const UMBRALES_SALUD = {
  pulso: { aviso: 120, critico: 150 }, // lpm: por encima → alerta
  spo2: { aviso: 94, critico: 90 }, // %: por debajo → alerta
}

export function reglaSalud({ salud }) {
  const alertas = []

  // TODO (Pamela): alerta 'salud-pulso' (aviso o crítico) según UMBRALES_SALUD.pulso.
  // TODO (Pamela): alerta 'salud-spo2' (aviso o crítico) según UMBRALES_SALUD.spo2.
  void salud

  return alertas
}
