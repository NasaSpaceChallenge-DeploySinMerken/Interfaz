import { useEffect, useState } from 'react'
import { Planificacion } from './planificacion/Planificacion'
import { Monitoreo } from './monitoreo/Monitoreo'
import { Control } from './control/Control'
import { esControlRemoto } from './control/canal'
import { cambiarIdioma, idiomaActual } from './idioma'

// Dos fases: primero se prepara el viaje y después se monitorea la caminata.
// Con #control en la dirección, la pestaña es el control de la demo (el teléfono).
export default function App() {
  const [viaje, setViaje] = useState(null)
  const [comoControl, setComoControl] = useState(esControlRemoto)
  const [idioma, setIdioma] = useState(idiomaActual)

  useEffect(() => {
    const alCambiar = () => setComoControl(esControlRemoto())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const seleccionarIdioma = (nuevo) => { cambiarIdioma(nuevo); setIdioma(nuevo) }
  return (
    <>
      <div className="idioma" role="group" aria-label={idioma === 'en' ? 'Language' : 'Idioma'}>
        <button type="button" lang="es" aria-pressed={idioma === 'es'} onClick={() => seleccionarIdioma('es')}>ES</button>
        <button type="button" lang="en" aria-pressed={idioma === 'en'} onClick={() => seleccionarIdioma('en')}>EN</button>
      </div>
      {comoControl
        ? <Control />
        : viaje
          ? <Monitoreo viaje={viaje} onSalir={() => setViaje(null)} />
          : <Planificacion onComenzar={setViaje} />}
    </>
  )
}
