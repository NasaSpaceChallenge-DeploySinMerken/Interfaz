import { useState } from 'react'
import { Planificacion } from './planificacion/Planificacion'
import { Monitoreo } from './monitoreo/Monitoreo'

// Dos fases: primero se prepara el viaje y después se monitorea la caminata.
export default function App() {
  const [ruta, setRuta] = useState(null)

  return (
    <div className="app">
      {ruta ? (
        <Monitoreo ruta={ruta} />
      ) : (
        <Planificacion onComenzar={setRuta} />
      )}
    </div>
  )
}
