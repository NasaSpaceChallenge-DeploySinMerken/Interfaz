import { useState } from 'react'
import { Planificacion } from './planificacion/Planificacion'
import { Monitoreo } from './monitoreo/Monitoreo'
import { Control } from './control/Control'
import { esControlRemoto } from './control/canal'

// Dos fases: primero se prepara el viaje y después se monitorea la caminata.
// Con #control en la dirección, la pestaña es el control remoto del astronauta.
export default function App() {
  const [viaje, setViaje] = useState(null)

  if (esControlRemoto()) return <Control />

  return viaje
    ? <Monitoreo viaje={viaje} onSalir={() => setViaje(null)} />
    : <Planificacion onComenzar={setViaje} />
}
