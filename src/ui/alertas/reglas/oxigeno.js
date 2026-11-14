// Reglas de oxígeno (P1 — Pamela).
//
// Cada regla recibe el estado de la simulación y devuelve una lista de alertas:
//   { id, nivel: 'info' | 'aviso' | 'critico', mensaje }
// El `id` tiene que ser fijo para cada condición (por ejemplo 'oxigeno-nivel'),
// así el sistema de alertas no la repite en cada segundo.

export const UMBRALES_OXIGENO = { aviso: 30, critico: 15 } // %

export function reglaOxigeno({ oxigeno }) {
  const alertas = []

  // TODO (Pamela): alerta 'oxigeno-nivel' (aviso o crítico) según UMBRALES_OXIGENO.
  // TODO (Pamela): alerta crítica 'oxigeno-retorno' si minutosRestantes < minutosParaVolver.
  void oxigeno

  return alertas
}
