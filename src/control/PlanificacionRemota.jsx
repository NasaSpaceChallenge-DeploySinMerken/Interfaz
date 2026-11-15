import { tr, trPunto } from '../idioma'
// Preparar el viaje desde el teléfono.
//
// Usa los mismos componentes que la pantalla de planificación, pero cada acción
// se manda a la demo como orden ({ tipo: 'plan', accion, ... }). La demo la aplica
// y devuelve su estado, que es lo que se dibuja aquí: así la demo y el teléfono
// muestran siempre lo mismo.

import { formatearCoords } from '../mapa/geo'
import { MapaPlanificacion } from '../planificacion/MapaPlanificacion'
import { SelectorCapas } from '../planificacion/SelectorCapas'
import { ListaPuntos } from '../planificacion/ListaPuntos'
import { FormCoordenadas } from '../planificacion/FormCoordenadas'
import { Metricas } from '../planificacion/Metricas'

export function PlanificacionRemota({ estado, enviar }) {
  const plan = (accion, datos = {}) => enviar({ tipo: 'plan', accion, ...datos })
  const { capas, activas, aterrizaje, puntos, volver, modo, calculando, errorRuta, idsConError, aviso, resultado, maxPuntos } = estado
  const capasVisibles = capas.filter((c) => activas.includes(c.id))
  const nombres = Object.fromEntries([['aterrizaje', tr('Aterrizaje')], ...puntos.map((p) => [p.id, trPunto(p.nombre)])])

  return (
    <div className="control__plan">
      <div className="control__mapa">
        <MapaPlanificacion
          capas={capasVisibles}
          aterrizaje={aterrizaje}
          puntos={puntos}
          volver={volver}
          ruta={resultado?.ruta}
          rutasSalidas={resultado?.rutasSalidas}
          modo={modo}
          onModo={(m) => plan('modoMarcado', { modo: m })}
          onMarcar={(p) => plan('marcar', { lon: p.lon, lat: p.lat })}
          aviso={aviso}
          idsConError={idsConError}
        />
      </div>
      <p className="control__ayuda">{tr("Toca el mapa para marcar. Lo que marques aparece en la demo.")}</p>

      <section className="paso" aria-labelledby="tr-aterrizaje">
        <h2 className="paso__titulo" id="tr-aterrizaje"><span className="paso__num">1</span>{tr("Punto de aterrizaje")}</h2>
        {aterrizaje
          ? <div className="aterrizaje-actual"><span className="marca-base" aria-hidden="true" /><span className="mono">{formatearCoords(aterrizaje)}</span></div>
          : <p className="paso__ayuda">{tr("Elige \"Aterrizaje\" arriba del mapa y toca donde quieras, o escribe las coordenadas.")}</p>}
        <FormCoordenadas textoBoton={tr("Fijar aterrizaje")} onEnviar={(p) => plan('fijarAterrizaje', { lon: p.lon, lat: p.lat })} />
      </section>

      <section className="paso" aria-labelledby="tr-puntos">
        <h2 className="paso__titulo" id="tr-puntos">
          <span className="paso__num">2</span>{tr("Puntos a visitar")}
          <span className={`paso__contador mono ${puntos.length >= maxPuntos ? 'lleno' : ''}`}>{puntos.length} {tr("de")} {maxPuntos}</span>
        </h2>
        <ListaPuntos
          puntos={puntos}
          hayAterrizaje={!!aterrizaje}
          onAgregar={(p) => plan('agregar', { lon: p.lon, lat: p.lat, nombre: p.nombre })}
          onQuitar={(id) => plan('quitar', { id })}
          onMover={(i, paso) => plan('mover', { i, paso })}
          onRenombrar={(id, nombre) => plan('renombrar', { id, nombre })}
        />
        <label className="check">
          <input type="checkbox" checked={volver} onChange={(e) => plan('volver', { valor: e.target.checked })} />
          <span>{tr("Volver al punto de aterrizaje")}<small>{tr("La ruta termina donde empezó.")}</small></span>
        </label>
        <div className="acciones">
          <button type="button" className="boton--texto" onClick={() => plan('ejemplo')}>{tr("Cargar ejemplo")}</button>
          <button type="button" className="boton--texto" onClick={() => plan('borrar')}>{tr("Borrar todo")}</button>
        </div>
      </section>

      <section className="paso" aria-labelledby="tr-capas">
        <h2 className="paso__titulo" id="tr-capas"><span className="paso__num">3</span>{tr("Capas del mapa")}</h2>
        <SelectorCapas capas={capas} activas={new Set(activas)} onCambiar={(id) => plan('capa', { id })} />
      </section>

      {resultado && (
        <section className="paso" aria-labelledby="tr-resultado" aria-live="polite">
          <h2 className="paso__titulo" id="tr-resultado"><span className="paso__num">4</span>{tr("Ruta calculada")}</h2>
          <Metricas resultado={resultado} nombres={nombres} />
        </section>
      )}

      <div className="control__pie">
        {errorRuta && <p className="error" role="alert">{tr(errorRuta)}</p>}
        {resultado ? (
          <button type="button" className="boton boton--principal" onClick={() => plan('comenzar')}>{tr("Comenzar caminata →")}</button>
        ) : (
          <button type="button" className="boton boton--principal" onClick={() => plan('calcular')} disabled={!aterrizaje || !puntos.length || calculando}>
            {calculando ? tr('Calculando…') : tr('Calcular ruta')}
          </button>
        )}
      </div>
    </div>
  )
}
