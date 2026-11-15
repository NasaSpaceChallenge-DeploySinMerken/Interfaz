# Interface — Martian Map

Browser interface for [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map). It is developed here and then integrated into the main repository.

- Task assignments: [Division_tareas_interfaz.md](Division_tareas_interfaz.md)
- Backend contract: [Contrato_API.md](Contrato_API.md)
- Proposal to the rest of the team: [Propuesta_equipo.md](Propuesta_equipo.md)

**Live demo: [martian-map.page](https://martian-map.page/?lang=en)** (Google Cloud, connected to the real backends). A phone joins by scanning the **QR code** shown during planning or opening the URL with its code, such as `https://martian-map.page/#control=1234`. The ⛶ button puts the demo in full screen for presentations.

The **ES / EN** selector in the upper-right corner changes the interface language without losing the trip. The choice is saved in the browser. You can also open `https://martian-map.page/?lang=en` directly; the phone-control QR code includes the chosen language.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. An internet connection is needed for the NASA Mars Trek map imagery.

1. **Plan the trip:** click the map to mark the landing site and up to six visits (or choose “Load example”), then select “Calculate route.”
2. **Walk:** “Start walk” opens the HUD **paused**. Select “Start” in the demo or on the phone. The map follows the astronaut, and alerts arrive every second.
   - In **Automatic route** mode, the astronaut follows the route.
   - In **Manual** mode, use **WASD**, arrow keys, the on-screen D-pad (press and hold), a connected joystick, or the phone. The astronaut may leave the route but not the demo area. A stop counts as reached within 25 m. Switching to manual reduces speed to x10.
   - In both modes, position and sensor data are sent to the monitoring backend every second.

The optional **THEMIS IR heatmap** layer shows relative infrared intensity in false color, not temperature in °C. The front end gets its catalog entry from `/api/layers` and the image from the layers backend through the public interface server.

### Control the demo from a phone

The computer browser is the **display** and the phone is the **controller**. Actions on the phone appear in the demo. On the phone you can plan (add, remove, and reorder visits; choose layers; load the example; calculate and start the walk) and, during the walk, start, pause, reset, change speed and mode, move with the touch joystick, view position, next stop, and alerts, or plan another trip.

To connect locally:

1. Start the interface so it is accessible on the network:

   ```bash
   npm run dev -- --host
   ```

   Vite prints a `Network: http://192.168.x.x:5173/` address.
2. Open the demo on the computer. The left panel shows a **QR code** and the **exact phone URL**, such as `http://192.168.1.20:5173/#control=4976` (the code changes).
3. Connect the phone to the **same Wi-Fi network** and scan the QR code or open the **complete URL, including `#control=…`**. Without the fragment, the phone offers a “Use as controller” button.
4. The demo reports “Phone connected”; it can now be controlled from the phone.

The code prevents a phone from controlling another demo on the same server. Direct URLs with `#control=4976` also work. **Only one pilot at a time:** the first phone to join controls the demo; additional phones are **spectators** with disabled controls. The pilot can release control, allowing a spectator to take over. Closing the page or losing the connection releases control after **5 seconds**. See [src/control/piloto.js](src/control/piloto.js).

In the published version, each demo asks the server for a unique code; the server does not reuse one held by another open demo. Codes become available 10 minutes after a demo closes. Under `npm run dev`, codes remain random.

- **Fedora:** if the phone cannot load the page, temporarily open the port with `sudo firewall-cmd --add-port=5173/tcp` (until reboot).
- **Without a phone:** during the walk, “Open ↗” next to the code opens the controller in a **separate window** on the same computer. Avoid another tab in the same window because browsers pause a hidden demo.
- The phone map uses + and − buttons for zoom; two-finger zoom is not yet supported.

The demo owns the state. The phone sends commands and renders the state returned by the demo. Windows in the same browser use `BroadcastChannel`; other devices communicate through the Vite server plugin in `vite.config.js`. This local phone setup therefore requires `npm run dev`.

### Backend configuration

Set variables in `.env.local`, which is excluded from Git. With no variables, the interface uses mock data.

| Variable | Backend | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | **Backend 1**, the map team's API | Plans routes through `POST /api/plan` on branch `feat/mapa-layers`. It delegates to team 3's analysis to follow terrain, order visits, estimate oxygen, report unreachable visits, and split trips if needed. Falls back to `POST /api/routes` if that endpoint is absent. |
| `VITE_ANALISIS_URL` | **Backend 2**, Javier's analysis service | Remaining distance, time, oxygen, grades, and hazards from the current position. |
| `VITE_MONITOREO_URL` | **Real-time monitoring**, Ingrid's service | Sends position every second and receives oxygen, return cost, and alerts. It runs with the analysis service. |

For development with real data, point `.env.local` at the published interface server, which forwards to private Google Cloud backends:

```dotenv
VITE_API_URL=https://martian-map.page
VITE_ANALISIS_URL=https://martian-map.page/analisis
VITE_MONITOREO_URL=https://martian-map.page/monitoreo
```

### Publish with the interface server

The [interface server](servidor/README.md) serves the page, proxies backend requests, and relays phone messages. This enables phone control in the published version while the backends remain private and may use HTTP or IP addresses; only the interface server needs HTTPS.

```bash
npm run build:servidor
BACKEND_1_URL=… BACKEND_2_URL=… BACKEND_MONITOREO_URL=… npm start   # http://localhost:8080
```

The current deployment is on Google Cloud. For another host, such as AWS, see [servidor/README.md](servidor/README.md).

### Automatic Google Cloud deployment

Every push to `main` runs `.github/workflows/deploy-gcp.yml`: it tests bilingual text, builds the interface server, and updates the `martian-front` Cloud Run service in `us-east1`. Its public domain is [martian-map.page](https://martian-map.page). `BACKEND_1_URL`, `BACKEND_2_URL`, and `BACKEND_MONITOREO_URL` point to the private layers backend, which forwards analysis and monitoring to a dedicated VM. GitHub authenticates with Workload Identity Federation restricted to this repository ID and `main`; no GCP keys are stored on GitHub. Older AWS and GitHub Pages workflows remain available for manual execution.

### Previous deployment: GitHub Pages and Cloudflare tunnels

> Google Cloud deployment replaced this route. Keep these instructions only if a return to GitHub Pages is needed.

The Pages site (`https://nasaspacechallenge-deploysinmerken.github.io/Interfaz/`) uses HTTPS and can therefore call only HTTPS backends; browsers block `http://IP:port` calls. Cloudflare tunnels expose the backends over HTTPS.

1. Marti and Javier open tunnels on their servers using [TUNELES.md](TUNELES.md) and provide their `https://….trycloudflare.com` URLs.
2. From `Interfaz`, configure both URLs:

   ```bash
   ./scripts/configurar-backends.sh https://<backend-1>.trycloudflare.com https://<backend-2>.trycloudflare.com
   ```

   The script checks both backends, writes `.env.local`, saves `VITE_API_URL` and `VITE_ANALISIS_URL` as GitHub repository variables, and republishes.
3. Once, set GitHub Settings → Pages → Build and deployment → Source to **GitHub Actions**.

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds with Vite and publishes `dist/` after each push to `main`. Without variables, the published page uses mock data. Phone control does not work on that Pages deployment (it needs `npm run dev -- --host` on a computer), although a controller in another window of the same browser does. If a tunnel URL changes, repeat step 2.

### Connect to the map team's API

The API is in [martian-map](https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map), branch `mapa-nacho-marti`, in `server/index.js`. Its contract is in `docs/API.md`. Use two terminals:

```bash
# Terminal 1: first-time setup
git clone https://github.com/NasaSpaceChallenge-DeploySinMerken/martian-map.git
cd martian-map
git checkout mapa-nacho-marti
npm install
# Each time: start the API at http://localhost:3000
npm run api
curl http://localhost:3000/api/health
```

```bash
# Terminal 2: point the interface at the API
cd Interfaz
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev
```

At `http://localhost:5173`, choose “Load example” and “Calculate route.” A working connection shows route validation and elevation; mock mode shows a mock-backend notice. To return to mock mode, remove `.env.local` and restart Vite.

Common issues:

- **Cannot connect to backend:** start the API and check `curl http://localhost:3000/api/health`.
- **Changes to `.env.local` have no effect:** Vite reads it at startup; restart `npm run dev`.
- **Port 5173 is busy:** Vite chooses another port and prints it. The API accepts requests from any port.
- **`.env.local` is not committed:** each developer can point to their own API.

The adapter in `src/api/cliente.js` translates the map API response:

| Feature | Source |
| --- | --- |
| Route calculation | `POST /api/routes` validates coordinates and elevation, then returns distance and elevation. |
| Route errors | `OUT_OF_SPACE` and `NO_DATA` identify the point and show a red pin. |
| Time, oxygen, effort, grade | Team 3's analysis; the interface polls `GET /api/routes/:id` every 3 s. |
| Map layers | Currently Mars Trek tiles. The API's GeoTIFF layers are intended for OpenLayers integration. |
| Monitoring and alerts | Mocked until the other team's endpoint is connected; mock alerts cover oxygen, health, suit temperature, and route deviation over 50 m. |

### Plan with `POST /api/plan`

On martian-map branch `feat/mapa-layers`, Backend 1 accepts the landing site and visits, forwards them to the analysis service's `POST /plan`, and returns its response unchanged. Start Backend 1 with `ANALYSIS_URL`:

```bash
git checkout feat/mapa-layers
ANALYSIS_URL=http://<analysis-service>:8000 npm run api
```

“Calculate route” then shows a terrain-following route and selected visit order, total and per-leg distance, duration, and oxygen, plus unreachable visits and their reasons. Unreachable visits appear in red and are omitted from the walk. If none are reachable, the walk cannot start. When one tank is insufficient, the route returns to the landing site for a refill; metrics show departures and refills, and the astronaut passes through “Landing (refill)” with a full tank.

If Backend 1 lacks `/api/plan` or `ANALYSIS_URL`, the interface uses the older `/api/routes` flow. With many distant points, analysis may exceed 60 seconds and Backend 1 times out. The example takes about 6 seconds, while six widely spaced points can take over 60 seconds. Set `ANALYSIS_TIMEOUT_MS` to raise the limit.

### Analysis service: metrics during the walk

Backend 2 is Javier's Python analysis service (martian-map branch `feat/javier/analisis`, `analysis/server.py`; contract in its README). It currently runs on a private Google Cloud VM with the Gale DEM; the interface reaches it through `/analisis` and `/monitoreo` on its own server.

During the walk, the interface sends the **current position and remaining stops in order** to `POST /gale/analyze`. It requests metrics at the start, then whenever the astronaut moves more than 15 m or changes stops, with at most one request in flight. The HUD shows remaining distance, time, oxygen needed to finish the current departure, and maximum grade toward the next stop. It warns when oxygen is insufficient with reserve or the current leg has a hazard. The phone also shows remaining time and oxygen.

Without `VITE_ANALISIS_URL`, the panel uses a straight-line local estimate (2.5 km/h, 1.43 g/min, 700 g tank). The service requires more than 1 m between consecutive points, so the interface removes a stop once the astronaut is on it. HTTP analysis works with `npm run dev`; an HTTPS deployment needs an HTTPS proxy. All time and oxygen figures are exploratory, not EVA safety guidance. The response adapter is `obtenerMetricasViaje` in `src/api/cliente.js`.

### Real-time monitoring

Monitoring runs in Ingrid's analysis service (martian-map branch `ingrid-consumo-tiempo-real`, `POST /api/monitoreo`; contract in `docs/API.md`). Oxygen, route status, and related alerts come from the backend; the interface animates the astronaut rather than reading a real suit. **Vital signs are simulated**, as described below.

1. `/plan` returns `idRuta` through Backend 1. If it is `null` (the route does not return to landing), the walk can proceed without monitoring and the HUD says so.
2. Every second the interface sends `{ idRuta, t, posicion, sensores }`; `t` is mission time in seconds. Resetting sets `t = 0`, which the backend treats as a new walk.
3. The HUD displays tank oxygen, oxygen for the return, reserve, route deviation, and backend alerts.
4. If the backend restarts and loses the route (`404`), the HUD offers a “Plan again” button.

The remaining distance, time, and grade still come from `/gale/analyze`; oxygen comes only from monitoring to avoid conflicting figures. Configure `VITE_MONITOREO_URL` in `.env.local` for development or `BACKEND_MONITOREO_URL` on the interface server. On Google Cloud it points to the private layers-backend proxy.

### Simulated vital signs and “Simulate emergency”

The backend accepts `sensores` but does not yet use them. For the demo, the interface simulates pulse, body temperature, and O₂ saturation in [src/monitoreo/signosVitales.js](src/monitoreo/signosVitales.js). Simulated cards and alerts are labeled as such.

- **Pulse from exertion:** based on a NASA study of 132 Shuttle and ISS EVAs, pulse = metabolism (BTU/h) ÷ (0.142 BTU per beat × 60). Flat walking uses the mean EVA metabolism (253 W → ~101 beats/min), with 3 W added per 1% grade; rest uses 160 W. Pulse is capped at 185 beats/min because the ISS relationship does not apply well at very high metabolism.
- **Simulate emergency:** a pilot-only phone button worsens all three signs evenly over 12 real-time seconds to critical levels (pulse ~172, temperature ~39.4 °C, saturation ~87.5%). Warnings appear after ~4–7 s, critical alerts after ~9–10 s. “Return to normal” restores them over another 12 s. Simulation runs even while the walk is paused and is not accelerated by x60 speed.
- Values are sent in `sensores` as `pulso`, `temperatura`, `saturacionO2`, and `simulado: true` for future backend evaluation.

Vital signs use green (normal), yellow (warning), and red (critical). Oxygen takes the highest severity sent by the backend: white with no alert or an informational one, yellow when return margin or reserve is no longer covered, and red when a return is impossible. See [src/monitoreo/nivelOxigeno.js](src/monitoreo/nivelOxigeno.js). These thresholds are project assumptions, not NASA thresholds:

| Sensor | Normal | Warning | Critical |
| --- | --- | --- | --- |
| Pulse (beats/min) | 86–120 (103 ± 17 in the study) | > 140 | > 160 |
| Body temperature | 36.0–37.5 °C | ≥ 38 or ≤ 35.5 °C | ≥ 39 or ≤ 35 °C |
| O₂ saturation | ≥ 95% | < 94% | < 90% |

## Structure

```text
src/
  App.jsx                     transitions between planning and walking
  style.css                   all interface styles
  api/cliente.js              backend adapter (Contrato_API.md)
  api/mock.js                 mock backend
  datos/gale.js               demo area, visit limit, and example
  mapa/geo.js                 tile, distance, and bearing calculations
  mapa/MapaTeselas.jsx        provisional Mars Trek tile map
  planificacion/              planning screen, map, visits, layers, and metrics
  monitoreo/                  walk HUD, simulation, alerts, vital signs, and manual controls
  control/                    phone pairing and control (#control)
mockup/                       standalone HTML design mockups
servidor/                     interface server and backend/phone relay
scripts/configurar-backends.sh
.github/workflows/deploy-gcp.yml
```

`MapaTeselas.jsx` is provisional; the map team is building the final map (see section 4 of [Propuesta_equipo.md](Propuesta_equipo.md)). All styles are in `src/style.css`. Colors and fonts are variables near `:root` (`--acento`, `--base`, `--punto`, `--critico`, `--aviso`, `--info`, etc.). The file is organized by screen and control; `mockup/` contains the original design references.
