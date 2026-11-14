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
2. **Caminata:** "Comenzar caminata" abre el HUD **en pausa**; pulsa "Iniciar" (en la demo o en el teléfono). El mapa sigue al astronauta y llegan las alertas cada segundo.
   - **Control "Ruta automática":** el astronauta sigue la ruta solo.
   - **Control "Manual":** se mueve con **WASD**, las **flechas**, la **cruceta** en pantalla (mantener apretada), un **joystick** conectado o el teléfono. Puede salir de la ruta, pero no del tramo de la demo. Una parada cuenta como alcanzada al pasar a menos de 25 m. Al entrar en manual, la velocidad baja a x10.
   - En los dos modos, cada segundo se envían la posición y los sensores al backend de monitoreo.

### Controlar la demo desde el teléfono

La demo (navegador del computador) es la **pantalla** y el teléfono es el **control**: todo lo que hagas en el teléfono se ve en la demo.

- **Preparar el viaje:** marcar el aterrizaje y los puntos tocando el mapa (o con coordenadas), quitarlos y reordenarlos, elegir capas, cargar el ejemplo, calcular la ruta y comenzar la caminata.
- **Caminata:** iniciar, pausar y reiniciar, velocidad, modo, joystick táctil para caminar, y ver posición, próxima parada y alertas. También volver a planificar otro viaje.

Cómo conectarlo:

1. En el computador, arranca la interfaz con acceso desde la red:
   ```bash
   npm run dev -- --host
   ```
   Vite muestra una línea `Network: http://192.168.x.x:5173/`.
2. Abre la demo en el navegador del computador. Arriba a la izquierda aparece "Control desde el teléfono · código **4976**" (el número cambia).
3. En el teléfono, conectado a **la misma red Wi-Fi**, abre `http://192.168.x.x:5173/#control`. Aparecen las demos abiertas: toca la tuya o escribe su código.
4. La demo muestra "Teléfono conectado". Desde ahí, todo se maneja en el teléfono.

El código evita que el teléfono controle otra demo abierta en el mismo servidor (por ejemplo, la de otra persona del equipo). Se puede abrir directo con `#control=4976`.

- **En Fedora**, si el teléfono no carga la página, abre el puerto mientras pruebas: `sudo firewall-cmd --add-port=5173/tcp` (dura hasta reiniciar).
- **Sin teléfono:** durante la caminata, "Abrir ↗" (junto al código) abre el control en una **ventana aparte** del mismo computador. No uses otra pestaña de la misma ventana: el navegador pausa la demo cuando no se ve.
- **En el mapa del teléfono** se acerca con los botones + y − (todavía no con dos dedos).

Cómo funciona: la demo es la dueña del estado; el teléfono manda órdenes y dibuja lo que la demo le devuelve. Las ventanas del mismo navegador se comunican con `BroadcastChannel`, y los otros dispositivos a través del servidor de Vite (plugin en `vite.config.js`). Por eso el teléfono funciona solo con `npm run dev`.

### Backends: qué variable usar

Todo se configura en `.env.local` (no se sube a git). Sin ninguna variable, todo es falso.

| Variable | Backend | Para qué |
| --- | --- | --- |
| `VITE_ANALISIS_URL` | Servicio de análisis de Javier (**en desarrollo**) | Calcula la ruta por el terreno, el orden de las visitas, el tiempo y el oxígeno. Si está, tiene prioridad para "Calcular ruta". |
| `VITE_API_URL` | API del equipo del mapa (Ignacio) | Valida la ruta (zona y elevación) y espera el análisis del equipo 3. Se usa si no hay `VITE_ANALISIS_URL`. |
| `VITE_MONITOREO_URL` | Backend de monitoreo (todavía no existe) | Recibe sensores y posición cada segundo y devuelve las alertas. |

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
| Monitoreo y alertas | **Falso** hasta que el otro equipo exponga su endpoint. El falso avisa de oxígeno, salud, temperatura del traje y desvío de la ruta (más de 50 m). |

### Con el servicio de análisis (en desarrollo)

Javier está armando un servicio aparte, en Python, en la rama `feat/javier/analisis` de martian-map (`analysis/server.py`, contrato en su `README.md`). Su `POST /plan` recibe el aterrizaje y las visitas y devuelve:

- la ruta **siguiendo el terreno** (busca caminos sobre el DEM y evita pendientes de 19° o más);
- **el orden** de las visitas que conviene (la lista de puntos se reordena sola);
- distancia, tiempo y **oxígeno en gramos** por tramo, y el total contra un tanque de 700 g con reserva;
- las visitas a las que **no se puede llegar** y por qué (se marcan en rojo y quedan fuera de la caminata).

Para probarlo:

```bash
# en martian-map, la rama de Javier (necesita Python con Pillow)
git checkout feat/javier/analisis
GALE_DEM_PATH=/ruta/a/Gale_DEM_SMG_1m.tif python analysis/server.py   # http://localhost:8000

# en Interfaz, .env.local
VITE_ANALISIS_URL=http://localhost:8000
```

**Necesita el DEM completo de Gale** (`Gale_DEM_SMG_1m.tif`, unos 5,8 GB), que no está en el repo. Sin él, "Calcular ruta" muestra "No se encontró el DEM de Gale". Javier también lo está preparando para Railway: cuando tenga una dirección pública, basta con ponerla en `VITE_ANALISIS_URL`.

Como está en desarrollo, la interfaz lo indica en las métricas, y el oxígeno es una estimación exploratoria. La traducción de su respuesta está en `src/api/cliente.js` (`adaptarPlan`).

### Con el backend de monitoreo

El monitoreo lo hace el backend de otro equipo, distinto de la API del mapa. Cuando esté disponible, se agrega su dirección a `.env.local`:

```
VITE_API_URL=http://localhost:3000
VITE_MONITOREO_URL=http://localhost:8100
```

La interfaz manda cada segundo `POST {VITE_MONITOREO_URL}/api/monitoreo` con `{ idRuta, t, posicion: { lon, lat }, sensores: { oxigenoPct, temperaturaTraje, temperaturaExterior, pulso, spo2 } }` y espera `{ alertas: [{ id, nivel, mensaje }] }` (detalle en [Contrato_API.md](Contrato_API.md)). Sin esa variable, usa el monitoreo falso.

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
    Cruceta.jsx               control manual en pantalla
  control/                    control de la demo desde el teléfono (#control)
    Control.jsx               emparejar con la demo y controlar la caminata
    PlanificacionRemota.jsx   preparar el viaje desde el teléfono
    canal.js                  comunicación entre demo y teléfono
    sesion.js                 código de 4 dígitos de cada demo
mockup/                       maquetas HTML sueltas (referencia de diseño)
```

`MapaTeselas.jsx` es un mapa provisional: el definitivo lo hace el equipo del mapa (ver [Propuesta_equipo.md](Propuesta_equipo.md), sección 4).

## Diseño

Todo el estilo está en `src/style.css`. Los colores y fuentes son variables al inicio (`:root`: `--acento`, `--base`, `--punto`, `--critico`, `--aviso`, `--info`, etc.), así que cambiarlas ahí cambia toda la interfaz. El archivo está ordenado por pantalla: base y controles, mapa, fase 1 (preparar el viaje), fase 2 (HUD de la caminata), cruceta y control desde el teléfono. Las maquetas de `mockup/` son la referencia de diseño original.
