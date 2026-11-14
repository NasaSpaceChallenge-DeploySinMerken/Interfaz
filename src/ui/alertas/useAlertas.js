// Sistema de alertas (J4 — Juan).

import { evaluarReglas } from './reglas'

export function useAlertas(estado) {
  const alertas = evaluarReglas(estado)

  // TODO (Juan): ordenar por nivel (crítico primero).
  // TODO (Juan): recordar las alertas cerradas para no volver a mostrarlas
  // mientras sigan activas con el mismo nivel.
  function cerrar(alerta) {
    void alerta
  }

  return { alertas, cerrar }
}
