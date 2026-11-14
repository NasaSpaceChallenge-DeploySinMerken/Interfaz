// Alertas en pantalla.
//
// El backend decide qué alertas hay: aquí solo se ordenan y se recuerda cuáles
// cerró el astronauta. Una alerta cerrada no vuelve mientras siga llegando con
// el mismo id y el mismo nivel; si sube de nivel o se apaga y vuelve, aparece de nuevo.

import { useEffect, useState } from 'react'

const PRIORIDAD = { critico: 0, aviso: 1, info: 2 }

export function useAlertas(delBackend) {
  const [cerradas, setCerradas] = useState({}) // id → nivel con que se cerró

  // olvidar las cerradas que ya no llegan o cambiaron de nivel
  useEffect(() => {
    setCerradas((previas) => {
      const vigentes = Object.fromEntries(
        Object.entries(previas).filter(([id, nivel]) => delBackend.some((a) => a.id === id && a.nivel === nivel)),
      )
      return Object.keys(vigentes).length === Object.keys(previas).length ? previas : vigentes
    })
  }, [delBackend])

  const alertas = delBackend
    .filter((a) => cerradas[a.id] !== a.nivel)
    .sort((a, b) => PRIORIDAD[a.nivel] - PRIORIDAD[b.nivel])

  const cerrar = (alerta) => setCerradas((previas) => ({ ...previas, [alerta.id]: alerta.nivel }))

  return { alertas, cerrar }
}
