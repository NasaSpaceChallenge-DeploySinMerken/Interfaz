// Fase 1: preparar el viaje.
//
// 1. Pide las capas al backend.
// 2. Se marca el aterrizaje y hasta MAX_PUNTOS puntos a visitar (clic en el mapa o a mano).
// 3. Los manda al backend y muestra la ruta y sus métricas.
// 4. "Comenzar caminata" pasa a la fase 2.
//
// Todo se puede hacer también desde el teléfono (#control): el teléfono manda
// órdenes y esta pantalla las aplica y le devuelve su estado, así lo que se marca
// en el teléfono se ve aquí.

import { useEffect, useRef, useState } from 'react'
import { obtenerCapas, obtenerRuta, planificarRuta, usaBackendFalso } from '../api/cliente'
import { EJEMPLO, MAX_PUNTOS, TRAMO } from '../datos/gale'
import { dentroDe, formatearCoords } from '../mapa/geo'
import { SelectorCapas } from './SelectorCapas'
import { ListaPuntos } from './ListaPuntos'
import { Metricas } from './Metricas'
import { FormCoordenadas } from './FormCoordenadas'
import { MapaPlanificacion } from './MapaPlanificacion'
import { abrirCanal } from '../control/canal'
import { CODIGO_SESION } from '../control/sesion'
import { AvisoEsTelefono, EnlaceTelefono } from '../control/EnlaceTelefono'

const ESPERA_TELEFONO_MS = 3000

export function Planificacion({ onComenzar }) {
  const [capas, setCapas] = useState([])
  const [activas, setActivas] = useState(new Set())
  const [errorCapas, setErrorCapas] = useState(null)

  const [aterrizaje, setAterrizaje] = useState(null)
  const [puntos, setPuntos] = useState([])
  const [volver, setVolver] = useState(true)
  const [modo, setModo] = useState('aterrizaje')

  const [resultado, setResultado] = useState(null)
  const [errorRuta, setErrorRuta] = useState(null)
  const [idsConError, setIdsConError] = useState([])
  const [calculando, setCalculando] = useState(false)

  const [aviso, setAviso] = useState(null)
  const temporizador = useRef(null)
  const siguienteId = useRef(1)

  useEffect(() => {
    obtenerCapas()
      .then((c) => { setCapas(c); setActivas(new Set(c.map((x) => x.id))) })
      .catch((e) => setErrorCapas(e.message))
  }, [])

  // con la API real, el análisis del equipo 3 llega después: se consulta cada 3 s
  const idRuta = resultado?.idRuta
  const esperandoAnalisis = !usaBackendFalso && resultado && resultado.estadoAnalisis !== 'analyzed'
  useEffect(() => {
    if (!esperandoAnalisis) return
    const inicio = { id: 'aterrizaje', nombre: 'Aterrizaje', ...aterrizaje }
    const secuencia = [inicio, ...puntos, ...(volver ? [inicio] : [])]
    const id = setInterval(async () => {
      try {
        const r = await obtenerRuta(idRuta, secuencia)
        if (r) setResultado(r)
      } catch {
        // se reintenta en la próxima vuelta
      }
    }, 3000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idRuta, esperandoAnalisis])

  function avisar(texto) {
    setAviso(texto)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setAviso(null), 2600)
  }

  // cualquier cambio en los puntos invalida la ruta calculada
  function cambio() {
    setResultado(null)
    setErrorRuta(null)
    setIdsConError([])
  }

  function nuevoPunto(p, nombre) {
    const n = siguienteId.current++
    return { id: `p${n}`, nombre: nombre || `Punto ${n}`, lon: +p.lon.toFixed(5), lat: +p.lat.toFixed(5) }
  }

  function fijarAterrizaje(p) {
    setAterrizaje({ lon: +p.lon.toFixed(5), lat: +p.lat.toFixed(5) })
    setModo('punto')
    cambio()
  }

  function agregarPunto(p) {
    if (puntos.length >= MAX_PUNTOS) return avisar(`Máximo ${MAX_PUNTOS} puntos a visitar. Quita uno para agregar otro.`)
    setPuntos((lista) => [...lista, nuevoPunto(p, p.nombre)])
    cambio()
  }

  function marcarEnMapa(p) {
    if (!dentroDe(TRAMO, p)) return avisar('Ese punto está fuera del tramo de la demo.')
    if (modo === 'aterrizaje' || !aterrizaje) fijarAterrizaje(p)
    else agregarPunto(p)
  }

  function moverPunto(i, paso) {
    setPuntos((lista) => {
      const nueva = [...lista]
      ;[nueva[i], nueva[i + paso]] = [nueva[i + paso], nueva[i]]
      return nueva
    })
    cambio()
  }

  function cargarEjemplo() {
    setAterrizaje(EJEMPLO.aterrizaje)
    setPuntos(EJEMPLO.puntos.map((p) => nuevoPunto(p, p.nombre)))
    setModo('punto')
    cambio()
  }

  function borrarTodo() {
    setAterrizaje(null)
    setPuntos([])
    setModo('aterrizaje')
    cambio()
  }

  async function calcular() {
    setCalculando(true)
    setErrorRuta(null)
    setIdsConError([])
    try {
      const r = await planificarRuta({ aterrizaje, puntos, volver })
      // el servicio de análisis elige el orden de las visitas: la lista lo refleja
      if (r.ordenIds?.length) {
        setPuntos((lista) => [
          ...r.ordenIds.map((id) => lista.find((p) => p.id === id)).filter(Boolean),
          ...lista.filter((p) => !r.ordenIds.includes(p.id)),
        ])
      }
      setIdsConError(r.inalcanzables?.map((v) => v.id) ?? [])
      setResultado(r)
    } catch (e) {
      setErrorRuta(e.message)
      setIdsConError(e.ids ?? [])
    } finally {
      setCalculando(false)
    }
  }

  const capasVisibles = capas.filter((c) => activas.has(c.id))
  const nombres = Object.fromEntries([['aterrizaje', 'Aterrizaje'], ...puntos.map((p) => [p.id, p.nombre])])

  const comenzar = () => {
    if (!resultado) return
    // las visitas a las que no se puede llegar quedan fuera de la caminata
    const fuera = new Set(resultado.inalcanzables?.map((v) => v.id) ?? [])
    onComenzar({ capas: capasVisibles, aterrizaje, puntos: puntos.filter((p) => !fuera.has(p.id)), volver, respuesta: resultado })
  }
  const alternarCapa = (id) => setActivas((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ---------------- Control desde el teléfono ----------------
  // órdenes que puede mandar el teléfono ({ tipo: 'plan', accion, ...datos })
  const ordenes = useRef({})
  ordenes.current = {
    marcar: (m) => marcarEnMapa({ lon: m.lon, lat: m.lat }),
    fijarAterrizaje: (m) => (dentroDe(TRAMO, m) ? fijarAterrizaje(m) : avisar('Ese punto está fuera del tramo de la demo.')),
    agregar: (m) => {
      if (!dentroDe(TRAMO, m)) return avisar('Ese punto está fuera del tramo de la demo.')
      if (!aterrizaje) return avisar('Primero marca el punto de aterrizaje.')
      agregarPunto({ lon: m.lon, lat: m.lat, nombre: m.nombre })
    },
    quitar: (m) => { setPuntos((l) => l.filter((p) => p.id !== m.id)); cambio() },
    mover: (m) => { if (puntos[m.i] && puntos[m.i + m.paso]) moverPunto(m.i, m.paso) },
    renombrar: (m) => setPuntos((l) => l.map((p) => (p.id === m.id ? { ...p, nombre: m.nombre } : p))),
    volver: (m) => { setVolver(!!m.valor); cambio() },
    modoMarcado: (m) => setModo(m.modo === 'punto' ? 'punto' : 'aterrizaje'),
    capa: (m) => alternarCapa(m.id),
    ejemplo: cargarEjemplo,
    borrar: borrarTodo,
    calcular: () => { if (aterrizaje && puntos.length && !calculando) calcular() },
    comenzar,
  }

  const canal = useRef(null)
  const [ultimoTelefono, setUltimoTelefono] = useState(0)
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    canal.current = abrirCanal('demo', CODIGO_SESION, (msg) => {
      setUltimoTelefono(Date.now())
      if (msg.tipo === 'plan') ordenes.current[msg.accion]?.(msg)
    })
    return () => canal.current.cerrar()
  }, [])

  // estado → teléfono: en cada cambio y una vez por segundo
  const estado = {
    tipo: 'estado', fase: 'planificacion', capas, activas: [...activas], aterrizaje, puntos, volver, modo,
    calculando, errorRuta, idsConError, aviso, resultado, maxPuntos: MAX_PUNTOS,
  }
  const estadoRef = useRef(estado)
  estadoRef.current = estado
  useEffect(() => {
    canal.current?.enviar(estadoRef.current)
  }, [capas, activas, aterrizaje, puntos, volver, modo, calculando, errorRuta, aviso, resultado])
  useEffect(() => {
    const id = setInterval(() => { canal.current?.enviar(estadoRef.current); setAhora(Date.now()) }, 1000)
    return () => clearInterval(id)
  }, [])
  const telefonoConectado = ahora - ultimoTelefono < ESPERA_TELEFONO_MS

  return (
    <div className="planificacion">
      <aside className="panel-lateral" aria-label="Preparar el viaje">
        <header className="cabecera">
          <p className="cabecera__marca">MARTIAN MAP</p>
          <h1 className="cabecera__titulo">Preparar el viaje</h1>
          <p className="cabecera__lugar">Cráter Gale · 137.30–137.60° E, 4.50–4.75° S</p>
        </header>

        <AvisoEsTelefono />
        <EnlaceTelefono conectado={telefonoConectado} />

        <section className="paso" aria-labelledby="t-capas">
          <h2 className="paso__titulo" id="t-capas"><span className="paso__num">1</span>Capas del mapa</h2>
          <SelectorCapas
            capas={capas}
            activas={activas}
            error={errorCapas}
            onCambiar={alternarCapa}
          />
        </section>

        <section className="paso" aria-labelledby="t-aterrizaje">
          <h2 className="paso__titulo" id="t-aterrizaje"><span className="paso__num">2</span>Punto de aterrizaje</h2>
          {aterrizaje && (
            <div className="aterrizaje-actual">
              <span className="marca-base" aria-hidden="true" />
              <span className="mono">{formatearCoords(aterrizaje)}</span>
            </div>
          )}
          <p className="paso__ayuda">
            {aterrizaje
              ? 'Para cambiarlo, elige "Aterrizaje" arriba del mapa y haz clic, o escribe otras coordenadas.'
              : 'Haz clic en el mapa o escribe las coordenadas.'}
          </p>
          <FormCoordenadas textoBoton="Fijar aterrizaje" onEnviar={fijarAterrizaje} />
        </section>

        <section className="paso" aria-labelledby="t-puntos">
          <h2 className="paso__titulo" id="t-puntos">
            <span className="paso__num">3</span>Puntos a visitar
            <span className={`paso__contador mono ${puntos.length >= MAX_PUNTOS ? 'lleno' : ''}`}>{puntos.length} de {MAX_PUNTOS}</span>
          </h2>
          <ListaPuntos
            puntos={puntos}
            hayAterrizaje={!!aterrizaje}
            onAgregar={agregarPunto}
            onQuitar={(id) => { setPuntos((l) => l.filter((p) => p.id !== id)); cambio() }}
            onMover={moverPunto}
            onRenombrar={(id, nombre) => setPuntos((l) => l.map((p) => (p.id === id ? { ...p, nombre } : p)))}
          />
          <label className="check">
            <input type="checkbox" checked={volver} onChange={(e) => { setVolver(e.target.checked); cambio() }} />
            <span>Volver al punto de aterrizaje<small>La ruta termina donde empezó.</small></span>
          </label>
          <div className="acciones">
            <button type="button" className="boton--texto" onClick={cargarEjemplo}>Cargar ejemplo</button>
            <button type="button" className="boton--texto" onClick={borrarTodo}>Borrar todo</button>
          </div>
        </section>

        {resultado && (
          <section className="paso" aria-labelledby="t-resultado" aria-live="polite">
            <h2 className="paso__titulo" id="t-resultado"><span className="paso__num">4</span>Ruta calculada</h2>
            <Metricas resultado={resultado} nombres={nombres} />
          </section>
        )}

        <footer className="pie">
          {errorRuta && <p className="error" role="alert">{errorRuta}</p>}
          {resultado ? (
            <button
              type="button"
              className="boton boton--principal"
              onClick={comenzar}
            >
              Comenzar caminata →
            </button>
          ) : (
            <button type="button" className="boton boton--principal" onClick={calcular} disabled={!aterrizaje || !puntos.length || calculando}>
              {calculando ? 'Calculando…' : 'Calcular ruta'}
            </button>
          )}
        </footer>
      </aside>

      <MapaPlanificacion
        capas={capasVisibles}
        aterrizaje={aterrizaje}
        puntos={puntos}
        volver={volver}
        ruta={resultado?.ruta}
        modo={modo}
        onModo={setModo}
        onMarcar={marcarEnMapa}
        aviso={aviso}
        idsConError={idsConError}
      />
    </div>
  )
}
