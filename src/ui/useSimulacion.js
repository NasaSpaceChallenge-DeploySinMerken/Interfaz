import { useSyncExternalStore } from 'react'
import { crearSimulacionFalsa } from '../mock/simulacionFalsa'

// Cuando esté lista la simulación real de src/sim/, cambiar solo esta línea
// (tiene que exponer obtenerEstado, suscribir, iniciar, pausar, reiniciar
// y cambiarVelocidad).
const simulacion = crearSimulacionFalsa()

export function useSimulacion() {
  const estado = useSyncExternalStore(simulacion.suscribir, simulacion.obtenerEstado)
  return { estado, acciones: simulacion }
}
