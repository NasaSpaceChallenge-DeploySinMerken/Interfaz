// Bucle de monitoreo.
//
// - Cada cuadro avanza la simulación según la velocidad (x1, x10, x60).
//   En modo manual, la dirección sale del teclado (WASD o flechas), de un
//   joystick conectado (Gamepad API) o de la cruceta en pantalla.
// - Cada 1 s real manda posición y sensores al backend de monitoreo y guarda
//   las alertas. Si el backend no responde, lo marca sin cortar la caminata.

import { useEffect, useMemo, useRef, useState } from 'react'
import { enviarMonitoreo } from '../api/cliente'
import { abrirCanal } from '../control/canal'
import { CODIGO_SESION } from '../control/sesion'
import { crearSensoresSimulados } from './sensoresSimulados'

const ESPERA_CONTROL_MS = 3000 // sin noticias del control remoto en este tiempo = desconectado


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
  const [sinConexion, setSinConexion] = useState(false)

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

  // control remoto: recibe dirección y modo, y le manda el estado 4 veces por segundo
  useEffect(() => {
    const canal = abrirCanal('demo', CODIGO_SESION, (msg) => {
      remoto.current.ultimo = Date.now()
      setControlRemoto(true)
      if (msg.tipo === 'direccion') {
        const hayDireccion = msg.x || msg.y
        remoto.current.direccion = hayDireccion ? { x: msg.x, y: msg.y } : null
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
        t: l.t,
      })
    }, 250)
    return () => { clearInterval(id); canal.cerrar() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return pad.current ?? remoto.current.direccion ?? direccionJoystick()
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

  // envío al backend de monitoreo cada 1 s
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
    cambiarModo,
    // cruceta en pantalla: { x, y } mientras se mantiene apretada, null al soltar
    moverPad: (direccion) => { pad.current = direccion },
  }

  return { lectura, sensores, alertas, sinConexion, enMarcha, velocidad, modo, controlRemoto, codigoSesion: CODIGO_SESION, acciones }
}
