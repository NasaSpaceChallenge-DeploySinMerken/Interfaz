// Sensores simulados del traje (Juan).
//
// En la demo no hay traje real: esto inventa las lecturas de los sensores y mueve
// al astronauta por la ruta. Cada segundo, useMonitoreo lee el estado y lo
// manda al backend con el formato de Contrato_API.md.

export function crearSensoresSimulados(ruta) {
  void ruta

  let estado = {
    t: 0,
    posicion: { lon: 0, lat: 0 },
    sensores: {
      oxigenoPct: 100,
      temperaturaTraje: 22,
      temperaturaExterior: -60,
      pulso: 80,
      spo2: 98,
    },
  }

  return {
    leer: () => estado,

    // Avanza la simulación `segundos` segundos.
    avanzar(segundos) {
      // TODO (Juan): mover al astronauta por la ruta y hacer variar los sensores
      // (el oxígeno baja, el pulso sube con la pendiente, etc.).
      void segundos
      void estado
    },

    reiniciar() {
      // TODO (Juan)
    },
  }
}
