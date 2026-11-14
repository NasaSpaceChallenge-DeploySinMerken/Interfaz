# Interfaz — Martian Map

Interfaz del navegador del proyecto [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). Se arma aquí y, cuando esté lista, se pasa al repo principal.

- Reparto de tareas: [Division_tareas_interfaz.md](Division_tareas_interfaz.md)
- Contrato con el backend: [Contrato_API.md](Contrato_API.md)
- Propuesta para el resto del equipo: [Propuesta_equipo.md](Propuesta_equipo.md)

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Necesita internet: las imágenes del mapa vienen de NASA Mars Trek.

1. **Preparar el viaje:** marca el aterrizaje y hasta 6 puntos con clics en el mapa (o "Cargar ejemplo") y pulsa "Calcular ruta".
2. **Caminata:** "Comenzar caminata" abre el HUD. El mapa sigue al astronauta y llegan las alertas del backend cada segundo.

Sin configurar nada usa un **backend falso** (`src/api/mock.js`): rutas en línea recta, métricas y alertas de ejemplo.

### Con la API del equipo del mapa

Su API vive en el repo [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map), rama `mapa-nacho-marti`. El código está en `server/index.js` y el contrato en `docs/API.md`. Se necesitan dos terminales.

**Terminal 1: levantar la API**

```bash
# la primera vez
git clone https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map.git
cd martian-map
git checkout mapa-nacho-marti
npm install

# cada vez
npm run api
```

Queda en `http://localhost:3000`. Para comprobar que responde:

```bash
curl http://localhost:3000/api/health
# {"ok":true,...}
```

**Terminal 2: la interfaz apuntando a la API**

```bash
cd Interfaz
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev
```

Abre `http://localhost:5173`, pulsa "Cargar ejemplo" y "Calcular ruta". Si la conexión funciona, el panel muestra "Ruta validada. Esperando el análisis del equipo 3…" y la elevación de la ruta. Con el backend falso, en cambio, aparece la nota "Backend falso".

**Volver al backend falso:** borrar `.env.local` (`rm .env.local`) y reiniciar `npm run dev`.

**Problemas comunes**

- **"No se pudo conectar con el backend":** la API no está corriendo o está en otro puerto. Revisa la terminal 1 y el `curl` de arriba.
- **Cambié `.env.local` y no pasa nada:** Vite lee ese archivo solo al arrancar, así que hay que detener `npm run dev` (Ctrl+C) y volver a correrlo.
- **El puerto 5173 está ocupado:** Vite usa el siguiente libre (5174, etc.) y lo indica en la terminal. La API acepta pedidos desde cualquier puerto.
- **`.env.local` no se sube a git:** es a propósito, porque cada uno apunta a su propia API.

Qué se usa de su API y qué sigue siendo falso (todo se traduce en `src/api/cliente.js`):

| Parte | Origen |
| --- | --- |
| Calcular ruta | `POST /api/routes`: valida que los puntos estén en la zona y con elevación, y devuelve la distancia y la elevación. |
| Errores de la ruta | `OUT_OF_SPACE` y `NO_DATA`: se muestran con el nombre del punto y el pin en rojo. |
| Tiempo, oxígeno, esfuerzo y pendiente | Llegan con el análisis del equipo 3. La interfaz consulta `GET /api/routes/:id` cada 3 s y los muestra cuando llegan. |
| Capas del mapa | Por ahora, teselas de Mars Trek. Las capas de su API son GeoTIFF para OpenLayers y se usarán al integrar su mapa. |
| Monitoreo y alertas | **Falso**, hasta que el otro equipo exponga su endpoint. |

## Estructura

```
src/
  App.jsx                     pasa de la fase 1 a la fase 2
  style.css                   estilos de toda la interfaz
  api/
    cliente.js                llamadas al backend (Contrato_API.md)
    mock.js                   backend falso
  datos/gale.js               tramo de la demo, máximo de puntos y ejemplo
  mapa/
    geo.js                    cálculos de teselas, distancias y rumbo
    MapaTeselas.jsx           mapa provisional con teselas de Mars Trek
  planificacion/              fase 1: preparar el viaje
    Planificacion.jsx         pantalla completa
    MapaPlanificacion.jsx     mapa con pines y clic para marcar
    SelectorCapas.jsx
    ListaPuntos.jsx
    FormCoordenadas.jsx
    Metricas.jsx
  monitoreo/                  fase 2: monitorear la caminata
    Monitoreo.jsx             HUD completo
    useMonitoreo.js           avanza la simulación y manda sensores cada 1 s
    sensoresSimulados.js      posición y lecturas del traje para la demo
    useAlertas.js, Alertas.jsx
    BarraSuperior.jsx, Brujula.jsx, Minimapa.jsx
mockup/                       maquetas HTML sueltas (referencia de diseño)
```

`MapaTeselas.jsx` es un mapa provisional: el definitivo lo hace el equipo del mapa (ver [Propuesta_equipo.md](Propuesta_equipo.md), sección 4).
