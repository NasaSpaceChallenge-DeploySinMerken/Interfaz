import { useState } from 'react'
import { Planificacion } from './planificacion/Planificacion'
import { Monitoreo } from './monitoreo/Monitoreo'

// Dos fases: primero se prepara el viaje y después se monitorea la caminata.
export default function App() {
  const [viaje, setViaje] = useState(null)

  return viaje
    ? <Monitoreo viaje={viaje} onSalir={() => setViaje(null)} />
    : <Planificacion onComenzar={setViaje} />
}
