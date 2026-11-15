# Interfaz — Martian Map

Interfaz del navegador del proyecto [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). Se arma aquí y, cuando esté lista, se pasa al repo principal.

- Reparto de tareas: [Division_tareas_interfaz.md](Division_tareas_interfaz.md)
- Contrato con el backend: [Contrato_API.md](Contrato_API.md)
- Propuesta para el resto del equipo: [Propuesta_equipo.md](Propuesta_equipo.md)

**Demo publicada: [https://martian-map.page](https://martian-map.page)** (Google Cloud, con los backends reales). El teléfono se conecta leyendo el **QR** que muestra la demo en la planificación (o abriendo la dirección con su código, `https://martian-map.page/#control=1234`). El botón ⛶ pone la demo en pantalla completa para la presentación.

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

La capa opcional **Mapa de calor · THEMIS IR** se activa en el selector de capas.
Muestra intensidad infrarroja relativa en falso color, no temperatura en °C.
El front obtiene la capa del catálogo `/api/layers` y su imagen del backend de
capas, a través del servidor público de la interfaz.

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
2. Abre la demo en el navegador del computador. En el panel izquierdo aparece un **QR** y **la dirección exacta para el teléfono**, por ejemplo `http://192.168.1.20:5173/#control=4976` (el código cambia).
3. En el teléfono, conectado a **la misma red Wi-Fi**, lee el QR con la cámara o abre esa dirección **completa, con `#control=…` al final**. Si abres la dirección sin `#control`, el teléfono muestra un aviso con el botón **"Usar como control"**.
4. La demo muestra "Teléfono conectado". Desde ahí, todo se maneja en el teléfono.

El código evita que el teléfono controle otra demo abierta en el mismo servidor (por ejemplo, la de otra persona del equipo). Se puede abrir directo con `#control=4976`.

**Un solo piloto a la vez.** Si varias personas leen el QR, la demo obedece solo a la primera (el piloto); las demás quedan en **modo espectador**: ven el viaje y los datos en su teléfono, con los mandos desactivados, y la demo ignora sus órdenes.
- El piloto puede **"Soltar el control"**; entonces un espectador puede **"Tomar el control"**.
- Si el piloto cierra la página o pierde la señal, el control se libera solo a los **5 s**.
- La lógica está en [src/control/piloto.js](src/control/piloto.js).

**Códigos únicos.** En la versión publicada, cada demo pide su código al servidor al abrirse, y el servidor nunca entrega uno que esté usando otra demo abierta. Un código queda libre 10 min después de cerrar su demo. Con `npm run dev` el código sigue siendo al azar.

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
| `VITE_MONITOREO_URL` | **Monitoreo en tiempo real** (Ingrid, en el servicio de análisis: misma dirección que el backend 2) | Recibe la posición cada segundo y devuelve el oxígeno, el costo de volver y las alertas. |

**Para desarrollar con los datos reales**, `.env.local` apunta al servidor publicado de la interfaz, que reenvía a los backends privados de Google Cloud (los backends no se pueden llamar directo desde tu computador):

```
VITE_API_URL=https://martian-map.page
VITE_ANALISIS_URL=https://martian-map.page/analisis
VITE_MONITOREO_URL=https://martian-map.page/monitoreo
```

### Publicar con el servidor propio de la interfaz (recomendado)

La interfaz tiene su propio servidor ([servidor/](servidor/README.md)): sirve la página, reenvía los pedidos a los backends y pasa los mensajes del teléfono. Así **funciona el control desde el teléfono en la versión publicada**, y los backends pueden seguir en `http` y por IP. Solo el servidor de la interfaz necesita `https`.

```bash
npm run build:servidor
BACKEND_1_URL=… BACKEND_2_URL=… BACKEND_MONITOREO_URL=… npm start   # http://localhost:8080
```

Hoy está desplegado en Google Cloud (sección siguiente). Para desplegarlo en otra máquina (por ejemplo, AWS): [servidor/README.md](servidor/README.md).

### Despliegue automático en Google Cloud

Cada push a `main` ejecuta `.github/workflows/deploy-gcp.yml`: construye el
servidor propio y actualiza Cloud Run `martian-front` en `us-east1`. El dominio
público es [martian-map.page](https://martian-map.page). `BACKEND_1_URL`,
`BACKEND_2_URL` y `BACKEND_MONITOREO_URL` apuntan al backend privado de capas;
ese backend reenvía análisis y monitoreo a la VM dedicada. GitHub se autentica
con Workload Identity Federation, restringida al ID de este repo y a `main`.
No hay claves GCP en GitHub. Los workflows anteriores de AWS y GitHub Pages
siguen disponibles para ejecución manual.

### Anterior: GitHub Pages + túneles de Cloudflare (ya no se usa)

> Este camino quedó reemplazado por el despliegue en Google Cloud (martian-map.page). Se deja por si hiciera falta volver a GitHub Pages; su workflow ahora solo corre a mano.

La página publicada (`https://nasaspacechallenge-deploysinmerken.github.io/Interfaz/`) es `https`, así que **solo puede usar backends `https`**: el navegador bloquea las llamadas a `http://IP:puerto`. Los backends se exponen por `https` con túneles de Cloudflare.

1. **Marti y Javier abren los túneles** en sus servidores: instrucciones en [TUNELES.md](TUNELES.md). Cada uno pasa su dirección `https://….trycloudflare.com`.
2. **Con las dos direcciones**, desde la carpeta `Interfaz`:
   ```bash
   ./scripts/configurar-backends.sh https://<backend-1>.trycloudflare.com https://<backend-2>.trycloudflare.com
   ```
   El script comprueba que respondan, escribe `.env.local`, guarda las direcciones como variables del repo en GitHub (`VITE_API_URL`, `VITE_ANALISIS_URL`) y vuelve a publicar la página.
3. **Una sola vez**, en GitHub: Settings → Pages → Build and deployment → Source → **"GitHub Actions"**.

La publicación la hace [.github/workflows/deploy.yml](.github/workflows/deploy.yml) en cada push a `main`: construye la app con Vite usando esas variables y publica la carpeta `dist/`. Sin variables, la página publicada usa los datos falsos.

En la página publicada, el teléfono como control no funciona (necesita `npm run dev -- --host` en un computador); sí funciona el control en otra ventana del mismo navegador.

Si la dirección de un túnel cambia (se reinició el túnel o el servidor), se vuelve a correr el paso 2 con la nueva.

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
ANALYSIS_URL=http://<servicio-de-análisis>:8000 npm run api   # http://localhost:3000
```

Con eso, "Calcular ruta" muestra:

- la ruta **siguiendo el terreno** y **el orden** que conviene (la lista de puntos se reordena sola);
- distancia, duración y **oxígeno** del total y por tramo;
- **visitas inalcanzables**: se avisan con su motivo ("no hay camino transitable en el terreno" o "no alcanza el oxígeno para volver con reserva"), se marcan en rojo y quedan fuera de la caminata. Si ninguna es alcanzable, sale un error y no se puede comenzar;
- **varias salidas**: si un tanque no alcanza, la ruta vuelve al aterrizaje a recargar. Las métricas indican cuántas salidas y recargas hay, y cada tramo dice a qué salida pertenece. En la caminata, el astronauta pasa por "Aterrizaje (recarga)" y el tanque vuelve a 100 %.

Si el backend 1 no tiene `/api/plan` (por ejemplo, la rama `mapa-nacho-marti`) o le falta `ANALYSIS_URL`, la interfaz usa sola el flujo anterior (`/api/routes`).

**Ojo con los tiempos:** con muchos puntos lejanos, el análisis puede tardar más de 60 s y el backend 1 corta con "El análisis no respondió en 60000 ms". Con el ejemplo tarda unos 6 s; con 6 puntos repartidos por todo el tramo, más de 60 s. Se puede subir el límite con `ANALYSIS_TIMEOUT_MS` al levantar el backend 1.

### Con el servicio de análisis: métricas durante el viaje (en desarrollo)

El backend 2 es el servicio de Javier, en Python (rama `feat/javier/analisis` de martian-map, `analysis/server.py`; contrato en su `README.md`). Hoy corre en una VM privada de Google Cloud con el DEM de Gale; la interfaz llega a él a través de su servidor (`/analisis` y `/monitoreo`).

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

### Monitoreo en tiempo real (Ingrid)

El monitoreo está en el servicio de análisis (rama `ingrid-consumo-tiempo-real` de martian-map, `POST /api/monitoreo`; contrato en su `docs/API.md`). El oxígeno, la ruta y sus alertas vienen solo del backend: la interfaz mueve al astronauta (no hay traje real). **La única excepción son los signos vitales**, que se simulan y se muestran marcados como "Simulado" (ver más abajo).

1. `/plan` (por el backend 1) devuelve un `idRuta`. Si viene en `null` (la ruta no vuelve al aterrizaje), la caminata se puede hacer pero no se monitorea, y el HUD lo indica.
2. Cada segundo, la interfaz manda `{ idRuta, t, posicion, sensores }`, donde `t` son los segundos de misión. "Reiniciar" vuelve a `t = 0`, que el backend toma como una caminata nueva.
3. Con lo que responde, el HUD muestra el panel **"Oxígeno"** (oxígeno en el tanque, oxígeno para volver, reserva, desvío de la ruta) y las alertas que manda el backend.
4. Si el backend se reinicia y pierde la ruta (`404`), aparece el aviso con el botón **"Volver a planificar"**.

El panel **"Lo que falta"** sigue saliendo de `/gale/analyze` (distancia, tiempo y pendiente de lo que queda). El oxígeno se toma solo del monitoreo, para no mostrar dos cifras distintas.

Configuración: `VITE_MONITOREO_URL` en `.env.local` (para `npm run dev`) o `BACKEND_MONITOREO_URL` en el servidor propio. En Google Cloud apunta al proxy privado del backend de capas. Sin esa dirección, el HUD muestra que el monitoreo no está configurado.

### Signos vitales simulados y "Simular emergencia"

El backend acepta `sensores` pero todavía no los usa (fase 2). Para mostrar en la demo las alertas fisiológicas, la interfaz **simula** pulso, temperatura del cuerpo y saturación de O₂ ([src/monitoreo/signosVitales.js](src/monitoreo/signosVitales.js)). Todo lo simulado lleva la etiqueta **"Simulado"**: la tarjeta "Signos vitales" del HUD y sus alertas.

- **Pulso desde el esfuerzo** (estudio de la NASA, 132 EVA de Shuttle e ISS): pulso = metabolismo (BTU/h) ÷ (0,142 BTU por latido × 60). Caminando en plano se usa el metabolismo promedio de una EVA (253 W → ~101 latidos/min), que sube 3 W por cada 1 % de pendiente del tramo; en reposo, 160 W. Tope de 185 latidos/min, porque la relación viene de la ISS y no sirve a metabolismos muy altos.
- **"Simular emergencia"**: botón en el control del teléfono (solo el piloto). Pensado para la demo: en 12 s los tres signos empeoran de forma pareja, de donde estaban hasta nivel crítico (pulso ~172, temperatura ~39,4 °C, saturación ~87,5 %); las alertas saltan primero en aviso (a los ~4-7 s) y después en crítico (a los ~9-10 s). "Volver a la normalidad" los baja de forma pareja en otros 12 s. Corre en tiempo real (la velocidad x60 no lo acelera) y también en pausa.
- Los valores se mandan en `sensores` (`pulso`, `temperatura`, `saturacionO2`, `simulado: true`), para cuando el backend los evalúe.

Colores: signos vitales en verde (normal), amarillo (aviso) y rojo (crítico). El oxígeno toma el color de la alerta más grave que manda el backend: blanco sin alertas o con la informativa, amarillo con el aviso (ya no cubre el margen de regreso ni la reserva) y rojo con la crítica (no alcanza para volver) ([src/monitoreo/nivelOxigeno.js](src/monitoreo/nivelOxigeno.js)).

Umbrales (supuestos del proyecto: la NASA no los define):

| Sensor | Normal | Aviso | Crítico |
|---|---|---|---|
| Pulso (latidos/min) | 86–120 (103 ± 17 del estudio) | > 140 | > 160 |
| Temperatura del cuerpo | 36,0–37,5 °C | ≥ 38 o ≤ 35,5 °C | ≥ 39 o ≤ 35 °C |
| Saturación de O₂ | ≥ 95 % | < 94 % | < 90 % |

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
    sensoresSimulados.js      movimiento del astronauta (no simula sensores)
    signosVitales.js          signos vitales SIMULADOS (pulso, temperatura, saturación) y sus alertas
    useAlertas.js, Alertas.jsx
    BarraSuperior.jsx, Brujula.jsx, Minimapa.jsx
    Cruceta.jsx               control manual en pantalla
    PanelViaje.jsx            oxígeno (monitoreo) y lo que falta del viaje (backend 2)
  control/                    control de la demo desde el teléfono (#control)
    Control.jsx               emparejar con la demo y controlar la caminata
    PlanificacionRemota.jsx   preparar el viaje desde el teléfono
    canal.js                  comunicación entre demo y teléfono
    piloto.js                 un solo piloto a la vez; los demás teléfonos, espectadores
    EnlaceTelefono.jsx        QR y dirección para abrir el control en el teléfono
    sesion.js                 código de 4 dígitos de cada demo
mockup/                       maquetas HTML sueltas (referencia de diseño)
servidor/                     servidor propio: sirve la página, reenvía a los backends y pasa los mensajes del teléfono
scripts/configurar-backends.sh configura las direcciones https de los backends
.github/workflows/deploy-gcp.yml  despliega Cloud Run en cada push a main
```

`MapaTeselas.jsx` es un mapa provisional: el definitivo lo hace el equipo del mapa (ver [Propuesta_equipo.md](Propuesta_equipo.md), sección 4).

## Diseño

Todo el estilo está en `src/style.css`. Los colores y fuentes son variables al inicio (`:root`: `--acento`, `--base`, `--punto`, `--critico`, `--aviso`, `--info`, etc.), así que cambiarlas ahí cambia toda la interfaz. El archivo está ordenado por pantalla: base y controles, mapa, fase 1 (preparar el viaje), fase 2 (HUD de la caminata), cruceta y control desde el teléfono. Las maquetas de `mockup/` son la referencia de diseño original.
