import { useSimulacion } from './ui/useSimulacion'
import { useAlertas } from './ui/alertas/useAlertas'
import { BarraSuperior } from './ui/BarraSuperior'
import { Alertas } from './ui/alertas/Alertas'

export default function App() {
  const { estado, acciones } = useSimulacion()
  const { alertas, cerrar } = useAlertas(estado)

  return (
    <div className="app">
      <BarraSuperior estado={estado} acciones={acciones} />

      <main className="contenido">
        {/* El mapa lo monta el otro equipo (src/map/ en martian-map). */}
        <div id="map" className="mapa">
          <p>Aquí va el mapa</p>
        </div>

        <Alertas alertas={alertas} onCerrar={cerrar} />
      </main>
    </div>
  )
}
