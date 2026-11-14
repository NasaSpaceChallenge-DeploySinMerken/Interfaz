// Control de la demo desde el teléfono (#control o #control=1234).
//
// La demo (navegador del computador) es la pantalla; el teléfono la maneja:
// - Preparar el viaje: marcar aterrizaje y puntos, calcular la ruta y comenzar.
// - Caminata: iniciar/pausar, velocidad, modo y joystick para caminar, con el
//   estado y las alertas del viaje.
// La demo es la dueña del estado: el teléfono manda órdenes y dibuja lo que la
// demo le devuelve, así los dos muestran siempre lo mismo.
//
// Como puede haber varias demos abiertas, se empareja con una por su código
// de 4 dígitos (se ve en el panel de la misión de la demo).

import { useEffect, useRef, useState } from 'react'
import { abrirCanal, codigoEnDireccion } from './canal'
import { formatearCoords, formatearDistancia } from '../mapa/geo'
import { PlanificacionRemota } from './PlanificacionRemota'

const ENVIOS_POR_SEGUNDO = 10
const ESPERA_DEMO_MS = 2000
const TECLAS = {
  ArrowUp: [0, 1], KeyW: [0, 1], ArrowDown: [0, -1], KeyS: [0, -1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
}
const ETIQUETAS = { critico: 'Crítico', aviso: 'Aviso', info: 'Info' }
const PRIORIDAD = { critico: 0, aviso: 1, info: 2 }

function leerMando() {
  const mando = [...(navigator.getGamepads?.() ?? [])].find(Boolean)
  if (!mando) return null
  let x = mando.axes[0] ?? 0
  let y = -(mando.axes[1] ?? 0)
  if (Math.hypot(x, y) < 0.2) { x = 0; y = 0 }
  const b = (i) => mando.buttons[i]?.pressed
  if (b(12)) y = 1
  if (b(13)) y = -1
  if (b(14)) x = -1
  if (b(15)) x = 1
  return x || y ? { x, y } : null
}

function Joystick({ onCambio, deshabilitado }) {
  const ref = useRef(null)
  const [palanca, setPalanca] = useState({ x: 0, y: 0 })
  const activo = useRef(false)

  function mover(e) {
    const r = ref.current.getBoundingClientRect()
    const radio = r.width / 2
    let dx = (e.clientX - (r.left + radio)) / radio
    let dy = (e.clientY - (r.top + radio)) / radio
    const largo = Math.hypot(dx, dy)
    if (largo > 1) { dx /= largo; dy /= largo }
    setPalanca({ x: dx, y: dy })
    onCambio(Math.hypot(dx, dy) < 0.15 ? null : { x: dx, y: -dy })
  }
  function soltar() {
    activo.current = false
    setPalanca({ x: 0, y: 0 })
    onCambio(null)
  }

  return (
    <div
      ref={ref}
      className={`joystick ${deshabilitado ? 'joystick--apagado' : ''}`}
      role="application"
      aria-label="Joystick: arrastra para caminar"
      onPointerDown={(e) => { if (deshabilitado) return; activo.current = true; e.currentTarget.setPointerCapture(e.pointerId); mover(e) }}
      onPointerMove={(e) => activo.current && mover(e)}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <span className="joystick__marca joystick__marca--n" aria-hidden="true">N</span>
      <div className="joystick__palanca" style={{ transform: `translate(${palanca.x * 50}%, ${palanca.y * 50}%)` }} />
    </div>
  )
}

// Pantalla para elegir la demo cuando el control se abre sin código.
function ElegirDemo({ demos, onElegir }) {
  const [codigo, setCodigo] = useState('')
  const valido = /^\d{4}$/.test(codigo)

  return (
    <section className="control__elegir" aria-labelledby="t-elegir">
      <h2 id="t-elegir" className="control__subtitulo">¿Qué demo quieres controlar?</h2>
      <p className="control__ayuda">El código aparece en la demo, arriba a la izquierda.</p>
      {demos.length > 0 ? (
        <div className="control__demos">
          {demos.map((d) => (
            <button key={d.codigo} type="button" className="boton boton--principal" onClick={() => onElegir(d.codigo)}>
              Demo {d.codigo} · {d.estado.fase === 'planificacion' ? 'preparando el viaje' : 'caminata en curso'}
            </button>
          ))}
        </div>
      ) : (
        <p className="control__estado" role="status"><span className="punto-estado" aria-hidden="true" />Buscando demos en curso…</p>
      )}
      <form className="control__codigo" onSubmit={(e) => { e.preventDefault(); if (valido) onElegir(codigo) }}>
        <label htmlFor="codigo-demo">O escribe el código</label>
        <div className="control__codigo-fila">
          <input id="codigo-demo" type="text" inputMode="numeric" maxLength={4} autoComplete="off" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} placeholder="0000" />
          <button type="submit" disabled={!valido}>Conectar</button>
        </div>
      </form>
    </section>
  )
}

export function Control() {
  const [codigo, setCodigo] = useState(codigoEnDireccion)
  const canal = useRef(null)
  const direccionPantalla = useRef(null)
  const teclas = useRef(new Set())
  const [estado, setEstado] = useState(null)
  const [ultimoEstado, setUltimoEstado] = useState(0)
  const [demos, setDemos] = useState({}) // código → { estado, ultimo }
  const [ahora, setAhora] = useState(Date.now())

  // el código también puede cambiar desde la dirección (#control=1234)
  useEffect(() => {
    const alCambiar = () => setCodigo(codigoEnDireccion())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  // canal con la demo: sin código escucha a todas para listarlas
  useEffect(() => {
    setEstado(null)
    canal.current = abrirCanal('control', codigo, (msg) => {
      if (msg.tipo !== 'estado') return
      if (codigo) { setEstado(msg); setUltimoEstado(Date.now()) }
      else if (msg.sesion) setDemos((d) => ({ ...d, [msg.sesion]: { estado: msg, ultimo: Date.now() } }))
    })
    return () => canal.current.cerrar()
  }, [codigo])

  // teclado
  useEffect(() => {
    const abajo = (e) => {
      if (!TECLAS[e.code] || e.target.closest?.('input')) return
      e.preventDefault()
      teclas.current.add(e.code)
    }
    const arriba = (e) => teclas.current.delete(e.code)
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    return () => { window.removeEventListener('keydown', abajo); window.removeEventListener('keyup', arriba) }
  }, [])

  // envío de la dirección (10 veces por segundo) y saludo para que la demo sepa que estamos
  useEffect(() => {
    let anterior = null
    let ultimoHola = 0
    const id = setInterval(() => {
      setAhora(Date.now())
      if (!codigo) return
      let x = 0, y = 0
      teclas.current.forEach((k) => { x += TECLAS[k][0]; y += TECLAS[k][1] })
      const dir = x || y ? { x, y } : direccionPantalla.current ?? leerMando()
      const cambio = JSON.stringify(dir) !== JSON.stringify(anterior)
      // mientras se camina se repite la dirección; al soltar se avisa una vez
      if (dir || cambio) canal.current?.enviar({ tipo: 'direccion', x: dir?.x ?? 0, y: dir?.y ?? 0 })
      anterior = dir
      if (Date.now() - ultimoHola > 1000) { canal.current?.enviar({ tipo: 'hola' }); ultimoHola = Date.now() }
    }, 1000 / ENVIOS_POR_SEGUNDO)
    return () => clearInterval(id)
  }, [codigo])

  function elegir(nuevo) {
    window.location.hash = nuevo ? `control=${nuevo}` : 'control'
    setCodigo(nuevo)
  }

  const conectado = codigo && estado && ahora - ultimoEstado < ESPERA_DEMO_MS
  const enviar = (msg) => canal.current?.enviar(msg)
  const demosActivas = Object.entries(demos)
    .filter(([, d]) => ahora - d.ultimo < ESPERA_DEMO_MS)
    .map(([c, d]) => ({ codigo: c, estado: d.estado }))

  return (
    <div className="control">
      <header className="control__cabecera">
        <p className="cabecera__marca">MARTIAN MAP</p>
        <h1 className="control__titulo">Control de la demo</h1>
        {codigo && (
          <p className={`control__estado ${conectado ? 'control__estado--ok' : ''}`} role="status">
            <span className="punto-estado" aria-hidden="true" />
            {!conectado
              ? `Buscando la demo ${codigo}…`
              : estado.fase === 'planificacion'
                ? `Demo ${codigo} · preparando el viaje`
                : `Demo ${codigo} · ${estado.enMarcha ? 'caminando' : 'en pausa'}`}
            <button type="button" className="boton--texto" onClick={() => elegir(null)}>Cambiar</button>
          </p>
        )}
      </header>

      {!codigo ? (
        <ElegirDemo demos={demosActivas} onElegir={elegir} />
      ) : !conectado ? (
        <p className="control__ayuda">Abre la demo en el navegador del computador. Si no aparece, revisa que el código sea el que muestra la demo.</p>
      ) : estado.fase === 'planificacion' ? (
        <PlanificacionRemota estado={estado} enviar={enviar} />
      ) : (
        <>
          <div className="control__fila">
            {conectado && estado.enMarcha
              ? <button type="button" className="boton boton--principal" onClick={() => enviar({ tipo: 'accion', accion: 'pausar' })}>Pausar</button>
              : <button type="button" className="boton boton--principal" onClick={() => enviar({ tipo: 'accion', accion: 'iniciar' })} disabled={!conectado}>{conectado && estado.terminado ? 'Repetir' : 'Iniciar'}</button>}
            <button type="button" onClick={() => enviar({ tipo: 'accion', accion: 'reiniciar' })} disabled={!conectado}>Reiniciar</button>
            <div className="segmentado segmentado--mono" role="group" aria-label="Velocidad">
              {[1, 10, 60].map((v) => (
                <button key={v} type="button" aria-pressed={!!conectado && estado.velocidad === v} onClick={() => enviar({ tipo: 'velocidad', valor: v })} disabled={!conectado}>x{v}</button>
              ))}
            </div>
          </div>

          <div className="segmentado control__modo" role="group" aria-label="Modo de control">
            <button type="button" aria-pressed={!!conectado && estado.modo === 'auto'} onClick={() => enviar({ tipo: 'modo', modo: 'auto' })} disabled={!conectado}>Ruta automática</button>
            <button type="button" aria-pressed={!!conectado && estado.modo === 'manual'} onClick={() => enviar({ tipo: 'modo', modo: 'manual' })} disabled={!conectado}>Manual</button>
          </div>

          <Joystick deshabilitado={!conectado} onCambio={(dir) => { direccionPantalla.current = dir }} />
          <p className="control__ayuda">Arrastra el círculo para caminar (también WASD, flechas o un joystick conectado). Al moverte, la demo pasa a modo manual.</p>

          {conectado && (
            <dl className="control__datos">
              <div><dt>Posición</dt><dd className="mono">{formatearCoords(estado.posicion)}</dd></div>
              <div><dt>Rumbo</dt><dd className="mono">{String(Math.round(estado.rumbo) % 360).padStart(3, '0')}°</dd></div>
              <div><dt>Próxima parada</dt><dd>{estado.proxima ? `${estado.proxima.nombre} · ${formatearDistancia(estado.proxima.faltaM)}` : 'Llegaste al destino'}</dd></div>
              <div><dt>Distancia restante</dt><dd className="mono">{formatearDistancia(estado.restante ?? 0)}</dd></div>
              {estado.monitoreo && (
                <>
                  <div><dt>Oxígeno en el tanque</dt><dd className="mono">{Math.round(estado.monitoreo.oxigenoRestanteG ?? 0)} g · {Math.round(estado.monitoreo.oxigenoPct ?? 0)} %</dd></div>
                  <div><dt>Oxígeno para volver</dt><dd className="mono">{Math.round(estado.monitoreo.costoRegresoG ?? 0)} g</dd></div>
                </>
              )}
              {estado.metricasViaje && (
                <div><dt>Tiempo para terminar</dt><dd className="mono">{estado.metricasViaje.tiempoMin} min</dd></div>
              )}
            </dl>
          )}

          {conectado && estado.alertas?.length > 0 && (
            <ul className="control__alertas" aria-label="Alertas del viaje" aria-live="polite">
              {[...estado.alertas].sort((a, b) => PRIORIDAD[a.nivel] - PRIORIDAD[b.nivel]).map((a) => (
                <li key={a.id} className={`alerta alerta--${a.nivel}`}>
                  <div className="alerta__cuerpo">
                    <span className="alerta__nivel">{ETIQUETAS[a.nivel] ?? a.nivel}</span>
                    <span className="alerta__titulo">{a.mensaje}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="boton--texto" onClick={() => enviar({ tipo: 'accion', accion: 'salir' })}>← Planificar otro viaje</button>
        </>
      )}
    </div>
  )
}
