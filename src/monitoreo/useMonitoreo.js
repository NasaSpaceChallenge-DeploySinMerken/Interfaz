// Bucle de monitoreo.
//
// - Cada cuadro avanza la simulación según la velocidad (x1, x10, x60).
//   En modo manual, la dirección sale del teclado (WASD o flechas), de un
//   joystick conectado (Gamepad API) o de la cruceta en pantalla.
// - Cada 1 s real manda el tiempo de misión y la posición al monitoreo
//   (POST /api/monitoreo, con el idRuta de /plan) y guarda lo que responde:
//   oxígeno, costo de volver y alertas. No hay sensores simulados: todo eso lo
//   calcula el backend. Si el backend ya no tiene la ruta, hay que volver a planificar.

import { useEffect, useMemo, useRef, useState } from 'react'
import { enviarMonitoreo, obtenerMetricasViaje } from '../api/cliente'
import { distancia } from '../mapa/geo'
import { abrirCanal } from '../control/canal'
import { CODIGO_SESION } from '../control/sesion'
import { crearSensoresSimulados } from './sensoresSimulados'

const ESPERA_CONTROL_MS = 3000 // sin noticias del control remoto en este tiempo = desconectado
const CADA_METRICAS_MS = 3000 // cada cuánto se revisa si hay que pedir métricas de viaje
const MOVIMIENTO_MINIMO_M = 15 // se piden de nuevo solo si el astronauta se movió esto


const TECLAS = {
  ArrowUp: [0, 1], KeyW: [0, 1],
  ArrowDown: [0, -1], KeyS: [0, -1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
}
const ZONA_MUERTA = 0.2

function direccionJoystick() {
  const mando = [...(navigator.getGamepads?.() ?? [])].find(Boolean)
  if (!mando) return null
  let x = mando.axes[0] ?? 0
  let y = -(mando.axes[1] ?? 0) // en el mando, abajo es positivo
  if (Math.hypot(x, y) < ZONA_MUERTA) { x = 0; y = 0 }
  // cruceta del mando (botones 12-15 en el mapeo estándar)
  const b = (i) => mando.buttons[i]?.pressed
  if (b(12)) y = 1
  if (b(13)) y = -1
  if (b(14)) x = -1
  if (b(15)) x = 1
  return x || y ? { x, y } : null
}

export function useMonitoreo(viaje, onSalir) {
  const sensores = useMemo(() => crearSensoresSimulados(viaje), [viaje])
  const [lectura, setLectura] = useState(() => sensores.leer())
  // empieza en pausa: se inicia desde el teléfono (o con el botón Iniciar)
  const [enMarcha, setEnMarcha] = useState(false)
  const [velocidad, setVelocidad] = useState(60)
  const [modo, setModo] = useState('auto')
  const [alertas, setAlertas] = useState([])
  const [monitoreo, setMonitoreo] = useState(null) // última respuesta de /api/monitoreo
  const [errorMonitoreo, setErrorMonitoreo] = useState(null)
  const [rutaPerdida, setRutaPerdida] = useState(false)
  const [reinicios, setReinicios] = useState(0)
  const [metricasViaje, setMetricasViaje] = useState(null)
  const [errorMetricas, setErrorMetricas] = useState(null)

  const velocidadRef = useRef(velocidad)
  velocidadRef.current = velocidad
  const teclas = useRef(new Set())
  const pad = useRef(null) // dirección de la cruceta en pantalla
  const remoto = useRef({ direccion: null, ultimo: 0 }) // control remoto (#control)
  const [controlRemoto, setControlRemoto] = useState(false)
  const modoRef = useRef(modo)
  modoRef.current = modo
  const enMarchaRef = useRef(enMarcha)
  enMarchaRef.current = enMarcha
  const alertasRef = useRef(alertas)
  alertasRef.current = alertas
  const metricasRef = useRef(metricasViaje)
  metricasRef.current = metricasViaje
  const monitoreoRef = useRef(monitoreo)
  monitoreoRef.current = monitoreo

  // control remoto: recibe dirección y modo, y le manda el estado 4 veces por segundo
  useEffect(() => {
    const canal = abrirCanal('demo', CODIGO_SESION, (msg) => {
      remoto.current.ultimo = Date.now()
      setControlRemoto(true)
      if (msg.tipo === 'direccion') {
        const hayDireccion = msg.x || msg.y
        remoto.current.direccion = hayDireccion ? { x: msg.x, y: msg.y } : null
        remoto.current.momentoDireccion = Date.now()
        if (hayDireccion && modoRef.current !== 'manual') cambiarModo('manual')
      }
      if (msg.tipo === 'modo') cambiarModo(msg.modo)
      if (msg.tipo === 'velocidad') setVelocidad(msg.valor)
      if (msg.tipo === 'accion' && ['iniciar', 'pausar', 'reiniciar'].includes(msg.accion)) acciones[msg.accion]()
      if (msg.tipo === 'accion' && msg.accion === 'salir') onSalir?.()
    })
    const id = setInterval(() => {
      if (Date.now() - remoto.current.ultimo > ESPERA_CONTROL_MS) {
        remoto.current.direccion = null
        setControlRemoto(false)
      }
      const l = sensores.leer()
      canal.enviar({
        tipo: 'estado',
        fase: 'monitoreo',
        posicion: l.posicion,
        rumbo: l.rumbo,
        modo: modoRef.current,
        enMarcha: enMarchaRef.current,
        velocidad: velocidadRef.current,
        terminado: l.terminado,
        proxima: l.proxima,
        restante: l.restante,
        alertas: alertasRef.current,
        metricasViaje: metricasRef.current,
        monitoreo: monitoreoRef.current,
        t: l.t,
      })
    }, 250)
    return () => { clearInterval(id); canal.cerrar() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensores])

  // métricas de lo que falta del viaje (backend 2): al empezar, al moverse y al
  // cambiar de parada; nunca dos pedidos a la vez
  useEffect(() => {
    let activo = true
    let enCurso = false
    let ultima = null // { posicion, siguiente }
    const revisar = async () => {
      const l = sensores.leer()
      const clave = l.pendientes.map((p) => p.id).join(',')
      const movido = !ultima || ultima.clave !== clave || distancia(ultima.posicion, l.posicion) >= MOVIMIENTO_MINIMO_M
      if (enCurso || !movido) return
      enCurso = true
      ultima = { posicion: l.posicion, clave }
      try {
        const m = await obtenerMetricasViaje({ posicion: l.posicion, pendientes: l.pendientes })
        if (activo) { setMetricasViaje(m); setErrorMetricas(null) }
      } catch (e) {
        if (activo) setErrorMetricas(e.message)
        ultima = null // se reintenta en la próxima vuelta
      } finally {
        enCurso = false
      }
    }
    revisar()
    const id = setInterval(revisar, CADA_METRICAS_MS)
    return () => { activo = false; clearInterval(id) }
  }, [sensores])

  // teclado (solo en modo manual)
  useEffect(() => {
    if (modo !== 'manual') return
    const esCampo = (e) => e.target.closest?.('input, textarea, select')
    const abajo = (e) => {
      if (!TECLAS[e.code] || esCampo(e)) return
      e.preventDefault()
      teclas.current.add(e.code)
    }
    const arriba = (e) => teclas.current.delete(e.code)
    const soltarTodo = () => teclas.current.clear()
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    window.addEventListener('blur', soltarTodo)
    return () => {
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
      window.removeEventListener('blur', soltarTodo)
      soltarTodo()
    }
  }, [modo])

  function direccionActual() {
    let x = 0, y = 0
    teclas.current.forEach((k) => { x += TECLAS[k][0]; y += TECLAS[k][1] })
    if (x || y) return { x, y }
    // el control repite la dirección 10 veces por segundo mientras se mueve: si deja
    // de llegar (por ejemplo, se perdió el aviso de "soltar"), el astronauta se detiene
    const remotaVigente = Date.now() - (remoto.current.momentoDireccion ?? 0) < 500 ? remoto.current.direccion : null
    return pad.current ?? remotaVigente ?? direccionJoystick()
  }

  function cambiarModo(nuevo) {
    sensores.cambiarModo(nuevo)
    setModo(nuevo)
    setLectura(sensores.leer())
    // a x60 el control manual es difícil: se baja a x10
    if (nuevo === 'manual') setVelocidad((v) => Math.min(v, 10))
    if (!sensores.leer().terminado) setEnMarcha(true)
  }

  // avance de la simulación
  useEffect(() => {
    if (!enMarcha) return
    let anterior = performance.now()
    let id
    const cuadro = (ahora) => {
      const dt = Math.min((ahora - anterior) / 1000, 0.25)
      anterior = ahora
      sensores.avanzar(dt * velocidadRef.current, direccionActual())
      const l = sensores.leer()
      setLectura(l)
      if (l.terminado) setEnMarcha(false)
      else id = requestAnimationFrame(cuadro)
    }
    id = requestAnimationFrame(cuadro)
    return () => cancelAnimationFrame(id)
  }, [enMarcha, sensores])

  // monitoreo en tiempo real: una lectura al empezar (y al reiniciar, con t = 0)
  // y después una por segundo mientras se camina
  const idMonitoreo = viaje.respuesta.idMonitoreo ?? null
  useEffect(() => {
    if (!idMonitoreo) {
      setErrorMonitoreo('Esta ruta no se puede monitorear: el análisis no devolvió un idRuta (la ruta tiene que volver al aterrizaje y calcularse con /api/plan).')
      return
    }
    if (rutaPerdida) return
    let activo = true
    const enviar = async () => {
      const l = sensores.leer()
      try {
        const r = await enviarMonitoreo({ idRuta: idMonitoreo, t: l.t, posicion: l.posicion })
        if (!activo) return
        setMonitoreo(r)
        setAlertas(r.alertas)
        setErrorMonitoreo(null)
      } catch (e) {
        if (!activo) return
        if (e.codigo === 'RUTA_DESCONOCIDA') {
          setRutaPerdida(true)
          setEnMarcha(false)
        }
        setErrorMonitoreo(e.message)
      }
    }
    enviar()
    if (!enMarcha) return () => { activo = false }
    const id = setInterval(enviar, 1000)
    return () => { activo = false; clearInterval(id) }
  }, [enMarcha, sensores, idMonitoreo, rutaPerdida, reinicios])

  const acciones = {
    iniciar: () => {
      if (sensores.leer().terminado) {
        // repetir una caminata terminada: vuelve a t = 0 (caminata nueva para el monitoreo)
        sensores.reiniciar()
        setLectura(sensores.leer())
        setMonitoreo(null)
        setReinicios((n) => n + 1)
      }
      setEnMarcha(true)
    },
    pausar: () => setEnMarcha(false),
    // la caminata vuelve a t = 0: el monitoreo la toma como una caminata nueva
    reiniciar: () => {
      sensores.reiniciar()
      setLectura(sensores.leer())
      setAlertas([])
      setMonitoreo(null)
      setEnMarcha(false)
      setReinicios((n) => n + 1)
    },
    cambiarVelocidad: setVelocidad,
    cambiarModo,
    // cruceta en pantalla: { x, y } mientras se mantiene apretada, null al soltar
    moverPad: (direccion) => { pad.current = direccion },
  }

  return {
    lectura, sensores, alertas, monitoreo, errorMonitoreo, rutaPerdida, metricasViaje, errorMetricas,
    enMarcha, velocidad, modo, controlRemoto, codigoSesion: CODIGO_SESION, acciones,
  }
}
