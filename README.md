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
2. Abre la demo en el navegador del computador. En el panel izquierdo aparece **la dirección exacta para el teléfono**, por ejemplo `http://192.168.1.20:5173/#control=4976` (el código cambia).
3. En el teléfono, conectado a **la misma red Wi-Fi**, abre esa dirección **completa, con `#control=…` al final**. Si abres la dirección sin `#control`, el teléfono muestra un aviso con el botón **"Usar como control"**.
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
| `VITE_API_URL` | **Backend 1**: API del equipo del mapa | **Calcular la ruta** en la planificación. Con `POST /api/plan` (rama `feat/mapa-layers`), que pasa la ruta al análisis del equipo 3: sigue el terreno, elige el orden, estima el oxígeno, marca las visitas inalcanzables y divide en varias salidas si hace falta. Si ese endpoint no existe, usa el flujo anterior `POST /api/routes`. |
| `VITE_ANALISIS_URL` | **Backend 2**: servicio de análisis de Javier (**en desarrollo**) | **Métricas durante el viaje**: lo que falta desde la posición actual (distancia, tiempo, oxígeno, pendientes y peligros). |
| `VITE_MONITOREO_URL` | Backend de monitoreo (todavía no existe) | Recibe sensores y posición cada segundo y devuelve las alertas. |

Ejemplo de `.env.local` con los dos backends que ya existen:

```
VITE_API_URL=http://localhost:3000
VITE_ANALISIS_URL=http://52.6.216.161:8000
```

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

### Calcular la ruta con `POST /api/plan` (backend 1 + análisis del equipo 3)

En la rama `feat/mapa-layers` de martian-map, el backend 1 tiene `POST /api/plan`: recibe el aterrizaje y las visitas, se los pasa al `POST /plan` del servicio de análisis y devuelve su respuesta tal cual. Para usarlo, el backend 1 se levanta con `ANALYSIS_URL`:

```bash
# en martian-map
git checkout feat/mapa-layers
ANALYSIS_URL=http://52.6.216.161:8000 npm run api   # http://localhost:3000
```

Con eso, "Calcular ruta" muestra:

- la ruta **siguiendo el terreno** y **el orden** que conviene (la lista de puntos se reordena sola);
- distancia, duración y **oxígeno** del total y por tramo;
- **visitas inalcanzables**: se avisan con su motivo ("no hay camino transitable en el terreno" o "no alcanza el oxígeno para volver con reserva"), se marcan en rojo y quedan fuera de la caminata. Si ninguna es alcanzable, sale un error y no se puede comenzar;
- **varias salidas**: si un tanque no alcanza, la ruta vuelve al aterrizaje a recargar. Las métricas indican cuántas salidas y recargas hay, y cada tramo dice a qué salida pertenece. En la caminata, el astronauta pasa por "Aterrizaje (recarga)" y el tanque vuelve a 100 %.

Si el backend 1 no tiene `/api/plan` (por ejemplo, la rama `mapa-nacho-marti`) o le falta `ANALYSIS_URL`, la interfaz usa sola el flujo anterior (`/api/routes`).

**Ojo con los tiempos:** con muchos puntos lejanos, el análisis puede tardar más de 60 s y el backend 1 corta con "El análisis no respondió en 60000 ms". Con el ejemplo tarda unos 6 s; con 6 puntos repartidos por todo el tramo, más de 60 s. Se puede subir el límite con `ANALYSIS_TIMEOUT_MS` al levantar el backend 1.

### Con el servicio de análisis: métricas durante el viaje (en desarrollo)

El backend 2 es el servicio de Javier, en Python (rama `feat/javier/analisis` de martian-map, `analysis/server.py`; contrato en su `README.md`). Está publicado en `http://52.6.216.161:8000`, ya con el DEM de Gale.

Durante la caminata, la interfaz le manda la **posición actual y las paradas que faltan, en orden**, a `POST /gale/analyze`. Lo pide al empezar y después cada vez que el astronauta se mueve más de 15 m o cambia de parada, nunca dos pedidos a la vez. Con los tramos de ida que devuelve, el HUD muestra el panel **"Lo que falta · backend 2"**:

- distancia, tiempo y **oxígeno necesario para terminar** (con varias salidas, para terminar **la salida actual**, hasta la próxima recarga), comparado con el oxígeno que queda en el tanque;
- la pendiente máxima del tramo hacia la próxima parada.

De esas métricas salen dos alertas: **"El oxígeno no alcanza para terminar con reserva"** (crítica) y el aviso de **peligros del tramo actual**, como "pendiente fuerte". El teléfono también muestra el tiempo y el oxígeno para terminar.

Sin `VITE_ANALISIS_URL`, el panel dice "estimación local" y calcula en línea recta con los mismos supuestos (2,5 km/h, 1,43 g/min, tanque de 700 g).

Notas:

- **El servicio pide más de 1 m entre puntos seguidos.** Cuando el astronauta está encima de una parada, la interfaz la saca de la lista.
- **La dirección es `http`.** Funciona con `npm run dev`; si la interfaz se publica con `https` (por ejemplo, en GitHub Pages), el navegador va a bloquear las llamadas hasta que el servicio tenga `https`.
- **Los tiempos y el oxígeno son estimaciones exploratorias**: el mismo servicio aclara que no es una herramienta de seguridad para una EVA.

La traducción de su respuesta está en `src/api/cliente.js` (`obtenerMetricasViaje`).

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
    PanelViaje.jsx            lo que falta del viaje (métricas del backend 2)
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
