import { useEffect, useState } from 'react'
import { Planificacion } from './planificacion/Planificacion'
import { Monitoreo } from './monitoreo/Monitoreo'
import { Control } from './control/Control'
import { esControlRemoto } from './control/canal'

// Dos fases: primero se prepara el viaje y después se monitorea la caminata.
// Con #control en la dirección, la pestaña es el control de la demo (el teléfono).
export default function App() {
  const [viaje, setViaje] = useState(null)
  const [comoControl, setComoControl] = useState(esControlRemoto)

  useEffect(() => {
    const alCambiar = () => setComoControl(esControlRemoto())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  if (comoControl) return <Control />

  return viaje
    ? <Monitoreo viaje={viaje} onSalir={() => setViaje(null)} />
    : <Planificacion onComenzar={setViaje} />
}
