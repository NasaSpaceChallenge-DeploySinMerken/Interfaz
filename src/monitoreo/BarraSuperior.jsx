// Panel de la misión: tiempo, modo de control y controles de la simulación.

import { BotonPantallaCompleta } from '../mapa/BotonPantallaCompleta'

const VELOCIDADES = [1, 10, 60]

function formatearTiempo(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = Math.floor(segundos % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function BarraSuperior({ t, enMarcha, velocidad, modo, controlRemoto, codigoSesion, acciones, onSalir }) {
  return (
    <section className="panel mision" aria-label="Misión">
      <div className="mision__cabecera">
        <div>
          <h1 className="mision__titulo">MARTIAN MAP</h1>
          <p className="mision__lugar">Cráter Gale · Caminata en curso</p>
        </div>
        <BotonPantallaCompleta />
      </div>
      <div className="mision__tiempo">
        <div className="etiqueta">Tiempo de misión</div>
        <div className="mision__reloj mono">{formatearTiempo(t)}</div>
      </div>

      <div className="mision__grupo">
        <span className="etiqueta" id="etiqueta-control">Control</span>
        <div className="segmentado" role="group" aria-labelledby="etiqueta-control">
          <button type="button" aria-pressed={modo === 'auto'} onClick={() => acciones.cambiarModo('auto')}><span className="solo-grande">Ruta automática</span><span className="solo-telefono">Automática</span></button>
          <button type="button" aria-pressed={modo === 'manual'} onClick={() => acciones.cambiarModo('manual')}>Manual</button>
        </div>
        <div className="mision__remoto-fila">
          <span className="mision__codigo">Código del control: <strong className="mono">{codigoSesion}</strong></span>
          {controlRemoto
            ? <span className="mision__remoto"><span className="punto-estado" aria-hidden="true" />Conectado</span>
            : (
              // en una ventana aparte: si fuera otra pestaña, la demo quedaría oculta y el navegador la pausaría
              <a
                className="mision__enlace"
                href={`#control=${codigoSesion}`}
                target="_blank"
                rel="noopener"
                onClick={(e) => {
                  const ventana = window.open(`${window.location.pathname}#control=${codigoSesion}`, 'martian-map-control', 'popup,width=420,height=780')
                  if (ventana) e.preventDefault()
                }}
              >
                Abrir ↗
              </a>
            )}
        </div>
      </div>

      <div className="controles">
        {enMarcha
          ? <button type="button" onClick={acciones.pausar}>Pausar</button>
          : <button type="button" onClick={acciones.iniciar}>Iniciar</button>}
        <button type="button" onClick={acciones.reiniciar}>Reiniciar</button>
        <div className="segmentado segmentado--mono" role="group" aria-label="Velocidad">
          {VELOCIDADES.map((v) => (
            <button key={v} type="button" aria-pressed={velocidad === v} onClick={() => acciones.cambiarVelocidad(v)}>x{v}</button>
          ))}
        </div>
      </div>
      <span className="mision__salto" aria-hidden="true" />
      <button type="button" className="boton--texto mision__salir" onClick={onSalir}><span className="solo-grande">← Planificar otro viaje</span><span className="solo-telefono">← Planificar</span></button>
    </section>
  )
}
