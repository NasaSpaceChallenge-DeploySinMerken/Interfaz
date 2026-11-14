// Fase 1: preparar el viaje (Pamela).
//
// 1. Pedir las capas al backend y mostrarlas.
// 2. Marcar el punto de aterrizaje y los puntos a visitar.
// 3. Mandarlos al backend y mostrar la ruta y sus métricas.
// 4. "Comenzar caminata" pasa a la fase 2 con la ruta calculada.

import { SelectorCapas } from './SelectorCapas'
import { ListaPuntos } from './ListaPuntos'
import { Metricas } from './Metricas'

export function Planificacion({ onComenzar }) {
  // TODO (Pamela): estado con capas, aterrizaje, puntos y la ruta calculada.
  // TODO (Pamela): botón "Calcular ruta" que llama a planificarRuta() de src/api/cliente.js.
  void onComenzar

  return (
    <section className="planificacion" aria-label="Preparar el viaje">
      <h2>Preparar el viaje</h2>
      <SelectorCapas />
      <ListaPuntos />
      <Metricas />
    </section>
  )
}
