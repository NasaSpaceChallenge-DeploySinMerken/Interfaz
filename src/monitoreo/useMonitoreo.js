// Bucle de monitoreo (Juan).
//
// Cada segundo: avanza los sensores simulados, manda posición y sensores
// al backend con enviarMonitoreo() y guarda las alertas que responde.

export function useMonitoreo(ruta) {
  // TODO (Juan): crear los sensores con crearSensoresSimulados(ruta).
  // TODO (Juan): intervalo de 1 s con enviarMonitoreo(); si el backend no responde,
  // mostrarlo sin cortar la caminata.
  // TODO (Juan): iniciar, pausar, reiniciar y velocidad (x1, x10, x60).
  void ruta

  return {
    estado: { t: 0, posicion: { lon: 0, lat: 0 }, sensores: {} },
    alertas: [],
    acciones: { iniciar() {}, pausar() {}, reiniciar() {}, cambiarVelocidad() {} },
  }
}
