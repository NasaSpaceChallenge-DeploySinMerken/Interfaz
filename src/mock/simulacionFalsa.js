// Simulación de prueba (J2 — Juan).
//
// Imita lo que va a entregar src/sim/ del otro equipo, con la forma de estado
// de la sección 3 de Division_tareas_interfaz.md.

function estadoInicial() {
  return {
    t: 0,
    enMarcha: false,
    velocidad: 1,
    oxigeno: { porcentaje: 100, consumoPorMin: 0.4, minutosRestantes: 250, minutosParaVolver: 0 },
    temperatura: { exterior: -60, traje: 22 },
    salud: { pulso: 80, spo2: 98 },
  }
}

export function crearSimulacionFalsa() {
  let estado = estadoInicial()

  return {
    obtenerEstado: () => estado,

    // Recibe una función que se llama cada vez que cambia el estado.
    // Devuelve la función para desuscribirse.
    suscribir(fn) {
      // TODO (Juan)
      void fn
      return () => {}
    },

    iniciar() {
      // TODO (Juan): avanzar el tiempo cada segundo y hacer variar los valores
      // para que pasen por todos los umbrales de las alertas.
    },

    pausar() {
      // TODO (Juan)
    },

    reiniciar() {
      // TODO (Juan)
    },

    cambiarVelocidad(velocidad) {
      // TODO (Juan)
      void velocidad
    },
  }
}
