// Bucle de monitoreo.
//
// - Cada cuadro avanza los sensores simulados según la velocidad (x1, x10, x60).
// - Cada 1 s real manda posición y sensores al backend y guarda las alertas.
//   Si el backend no responde, lo marca sin cortar la caminata.

import { useEffect, useMemo, useRef, useState } from 'react'
import { enviarMonitoreo } from '../api/cliente'
import { crearSensoresSimulados } from './sensoresSimulados'

export function useMonitoreo(viaje) {
  const sensores = useMemo(() => crearSensoresSimulados(viaje), [viaje])
  const [lectura, setLectura] = useState(() => sensores.leer())
  const [enMarcha, setEnMarcha] = useState(true)
  const [velocidad, setVelocidad] = useState(60)
  const [alertas, setAlertas] = useState([])
  const [sinConexion, setSinConexion] = useState(false)

  const velocidadRef = useRef(velocidad)
  velocidadRef.current = velocidad

  // avance de la simulación
  useEffect(() => {
    if (!enMarcha) return
    let anterior = performance.now()
    let id
    const cuadro = (ahora) => {
      const dt = Math.min((ahora - anterior) / 1000, 0.25)
      anterior = ahora
      sensores.avanzar(dt * velocidadRef.current)
      const l = sensores.leer()
      setLectura(l)
      if (l.terminado) setEnMarcha(false)
      else id = requestAnimationFrame(cuadro)
    }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [enMarcha, sensores])

  // envío al backend cada 1 s
  useEffect(() => {
    if (!enMarcha) return
    let activo = true
    const enviar = async () => {
      const l = sensores.leer()
      try {
        const r = await enviarMonitoreo({
          idRuta: viaje.respuesta.idRuta,
          t: Math.round(l.t),
          posicion: l.posicion,
          sensores: l.sensores,
        })
        if (activo) { setAlertas(r.alertas); setSinConexion(false) }
      } catch {
        if (activo) setSinConexion(true)
      }
    }
    enviar()
    const id = setInterval(enviar, 1000)
    return () => { activo = false; clearInterval(id) }
  }, [enMarcha, sensores, viaje])

  const acciones = {
    iniciar: () => {
      if (sensores.leer().terminado) { sensores.reiniciar(); setLectura(sensores.leer()) }
      setEnMarcha(true)
    },
    pausar: () => setEnMarcha(false),
    reiniciar: () => {
      sensores.reiniciar()
      setLectura(sensores.leer())
      setAlertas([])
      setEnMarcha(false)
    },
    cambiarVelocidad: setVelocidad,
  }

  return { lectura, sensores, alertas, sinConexion, enMarcha, velocidad, acciones }
}
