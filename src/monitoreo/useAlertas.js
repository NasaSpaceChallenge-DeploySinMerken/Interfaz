// Alertas en pantalla (Juan).
//
// El backend decide qué alertas hay: aquí solo se ordenan y se recuerda
// cuáles cerró el astronauta.

export function useAlertas(alertasDelBackend) {
  // TODO (Juan): ordenar por nivel (crítico primero).
  // TODO (Juan): no volver a mostrar una alerta cerrada mientras siga llegando
  // con el mismo id y el mismo nivel.
  function cerrar(alerta) {
    void alerta
  }

  return { alertas: alertasDelBackend, cerrar }
}
