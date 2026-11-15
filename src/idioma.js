// El idioma es una preferencia de presentación; los códigos y contratos de la API no cambian.
const opciones = new Set(['es', 'en'])
const parametro = new URLSearchParams(window.location.search).get('lang')
let idioma = opciones.has(parametro) ? parametro : localStorage.getItem('martian-map-idioma') || 'es'
if (!opciones.has(idioma)) idioma = 'es'
document.documentElement.lang = idioma
document.title = idioma === 'en' ? 'Martian Map — Interface' : 'Martian Map — Interfaz'

const ingles = {
  'Preparar el viaje': 'Plan your journey',
  'Cráter Gale · 137.30–137.60° E, 4.50–4.75° S': 'Gale Crater · 137.30–137.60° E, 4.50–4.75° S',
  'Capas del mapa': 'Map layers',
  'Punto de aterrizaje': 'Landing point',
  'Puntos a visitar': 'Places to visit',
  'Ruta calculada': 'Calculated route',
  'Aterrizaje': 'Landing',
  'Punto a visitar': 'Place to visit',
  'Fijar aterrizaje': 'Set landing point',
  'Agregar punto': 'Add place',
  'Volver al punto de aterrizaje': 'Return to the landing point',
  'La ruta termina donde empezó.': 'The route ends where it started.',
  'Cargar ejemplo': 'Load example',
  'Borrar todo': 'Clear all',
  'Comenzar caminata →': 'Start walk →',
  'Calculando…': 'Calculating…',
  'Calcular ruta': 'Calculate route',
  'Cargando capas…': 'Loading layers…',
  'No se pudieron cargar las capas:': 'Could not load layers:',
  'Escala relativa de infrarrojo: menor a mayor intensidad': 'Relative infrared scale: low to high intensity',
  'Haz clic en el mapa o escribe las coordenadas.': 'Click the map or enter the coordinates.',
  'Para cambiarlo, elige "Aterrizaje" arriba del mapa y haz clic, o escribe otras coordenadas.': 'To change it, select “Landing” above the map and click, or enter other coordinates.',
  'Toca el mapa para marcar. Lo que marques aparece en la demo.': 'Tap the map to place a point. It will appear on the demo screen.',
  'Elige "Aterrizaje" arriba del mapa y toca donde quieras, o escribe las coordenadas.': 'Select “Landing” above the map and tap a location, or enter the coordinates.',
  'Haz clic en el mapa para agregar puntos.': 'Click the map to add places.',
  'Primero marca el punto de aterrizaje.': 'Set the landing point first.',
  'Nombre (opcional)': 'Name (optional)',
  'Longitud (° E)': 'Longitude (° E)',
  'Latitud (° S)': 'Latitude (° S)',
  'Escribe la longitud y la latitud.': 'Enter the longitude and latitude.',
  'Fuera del tramo: longitud 137.30–137.60 y latitud 4.50–4.75.': 'Outside the area: longitude 137.30–137.60 and latitude 4.50–4.75.',
  'No se puede llegar a:': 'Unreachable places:',
  'Distancia': 'Distance',
  'Duración': 'Duration',
  'Oxígeno necesario': 'Oxygen needed',
  'Salidas': 'Trips',
  'Esfuerzo': 'Effort',
  'Pendiente máxima': 'Maximum slope',
  'Elevación': 'Elevation',
  'Por tramo': 'By segment',
  'Tramo': 'Segment',
  'Desnivel': 'Elevation change',
  'Tiempo': 'Time',
  'No disponible': 'Unavailable',
  'Pendiente del análisis': 'Awaiting analysis',
  'Bajo': 'Low', 'Medio': 'Medium', 'Alto': 'High',
  'Ruta validada. Analizando el terreno…': 'Route validated. Analyzing terrain…',
  'Analizando el terreno…': 'Analyzing terrain…',
  'Ruta calculada según el terreno: sigue el relieve y elige el mejor orden para las visitas. El consumo de oxígeno es una estimación.': 'Terrain based route: follows the relief and chooses the best visit order. Oxygen use is an estimate.',
  'Ruta validada. Tramos en línea recta entre tus puntos.': 'Route validated. Straight line segments between your points.',
  'Datos de ejemplo, sin conexión al servidor: tramos en línea recta y valores aproximados.': 'Sample data without a server connection: straight line segments and approximate values.',
  'sin reserva suficiente': 'insufficient reserve',
  'recarga': 'refill', 'recargas': 'refills',
  'una sola caminata': 'one walk',
  'Al hacer clic marcar:': 'Click to place:',
  'Mueve el cursor sobre el mapa': 'Move the cursor over the map',
  'Mapa del cráter Gale. Haz clic para marcar puntos.': 'Gale Crater map. Click to place points.',
  'Qué marcar al hacer clic': 'What to place on click',
  'Salidas del viaje': 'Trips in this journey',
  'Imágenes: CTX (NASA/JPL-Caltech/MSSS) y HiRISE (NASA/JPL-Caltech/Univ. of Arizona), vía NASA Mars Trek. Coloreadas para el diseño.': 'Imagery: CTX (NASA/JPL-Caltech/MSSS) and HiRISE (NASA/JPL-Caltech/Univ. of Arizona), via NASA Mars Trek. Colorized for the design.',
  'Controlar desde el teléfono': 'Control from your phone',
  'Teléfono conectado · código': 'Phone connected · code',
  'Lee el QR con la cámara del teléfono, o abre:': 'Scan the QR code with your phone camera, or open:',
  'Lee el QR con la cámara del teléfono (en la misma Wi-Fi), o abre:': 'Scan the QR code with your phone camera (on the same Wi-Fi), or open:',
  'Estás en un teléfono. Para manejar la demo que está abierta en el computador, usa este teléfono como control.': 'You are on a phone. Use it to control the demo open on your computer.',
  'Usar como control': 'Use as controller',
  'Control de la demo': 'Demo controller',
  'Modo espectador': 'Spectator mode',
  'Tienes el control de la demo.': 'You are controlling the demo.',
  'Soltar el control': 'Release control',
  'Nadie está controlando la demo.': 'Nobody is controlling the demo.',
  'Tomar el control': 'Take control',
  'Otra persona está controlando la demo. Puedes seguir el viaje desde aquí; cuando suelte el control, podrás tomarlo.': 'Someone else is controlling the demo. You can follow the journey here and take over when they release control.',
  '¿Qué demo quieres controlar?': 'Which demo do you want to control?',
  'El código aparece en la demo, arriba a la izquierda.': 'The code appears at the top left of the demo.',
  'Buscando demos en curso…': 'Looking for active demos…',
  'O escribe el código': 'Or enter the code',
  'Conectar': 'Connect',
  'Cambiar': 'Change',
  'Abre la demo en el navegador del computador. Si no aparece, revisa que el código sea el que muestra la demo.': 'Open the demo in your computer browser. If it does not appear, check that the code matches the demo.',
  'Pausar': 'Pause', 'Iniciar': 'Start', 'Repetir': 'Replay', 'Reiniciar': 'Reset',
  'Ruta automática': 'Automatic route', 'Automática': 'Automatic', 'Manual': 'Manual',
  'Arrastra el círculo para caminar (también WASD, flechas o un joystick conectado). Al moverte, la demo pasa a modo manual.': 'Drag the circle to walk (or use WASD, arrow keys, or a connected gamepad). Moving switches the demo to manual mode.',
  'Simular signos vitales': 'Simulate vital signs',
  'Volver a la normalidad': 'Return to normal', 'Simular emergencia': 'Simulate emergency',
  'En 12 s el pulso y la temperatura suben y la saturación baja hasta nivel crítico (rojo), pasando por aviso (amarillo). Volver a la normalidad también tarda 12 s. Son datos simulados, no del traje.': 'Over 12 s, heart rate and temperature rise while oxygen saturation falls to critical (red), passing warning (yellow). Returning to normal also takes 12 s. These are simulated values, not suit readings.',
  'Posición': 'Position', 'Rumbo': 'Heading', 'Próxima parada': 'Next stop',
  'Distancia restante': 'Remaining distance', 'Oxígeno en el tanque': 'Oxygen in tank',
  'Oxígeno para volver': 'Oxygen to return', 'Signos vitales (simulados)': 'Vital signs (simulated)',
  'Tiempo para terminar': 'Time to finish', 'Alertas del viaje': 'Journey alerts',
  '← Planificar otro viaje': '← Plan another journey', '← Planificar': '← Plan',
  'Cráter Gale · Caminata en curso': 'Gale Crater · Walk in progress',
  'Tiempo de misión': 'Mission time', 'Control': 'Control',
  'Código del control:': 'Controller code:', 'Conectado': 'Connected', 'Abrir ↗': 'Open ↗',
  'Misión': 'Mission', 'Velocidad': 'Speed',
  'Monitoreo': 'Monitoring', 'Demo': 'Demo',
  'Se perdió el seguimiento de esta ruta': 'Tracking for this route was lost',
  'El servicio de monitoreo se reinició. Para seguir, vuelve a planificar el viaje.': 'The monitoring service restarted. Plan the journey again to continue.',
  'Volver a planificar': 'Plan again',
  'Borde del tramo de la demo': 'Edge of the demo area',
  'No se puede seguir en esa dirección.': 'You cannot continue in that direction.',
  'Llegaste al destino': 'You reached the destination',
  'Recorrido': 'Distance traveled', 'el final': 'the end',
  'Alejar': 'Zoom out', 'Acercar': 'Zoom in',
  'Imágenes: NASA Mars Trek (CTX: NASA/JPL-Caltech/MSSS · HiRISE: NASA/JPL-Caltech/Univ. of Arizona), coloreadas para el diseño.': 'Imagery: NASA Mars Trek (CTX: NASA/JPL-Caltech/MSSS · HiRISE: NASA/JPL-Caltech/Univ. of Arizona), colorized for the design.',
  'Oxígeno': 'Oxygen', 'sin datos': 'no data', 'Esperando datos…': 'Waiting for data…',
  'En el tanque': 'In the tank', 'Para volver al aterrizaje': 'To return to landing',
  'Reserva': 'Reserve', 'Fuera de la ruta': 'Off route', 'Astronauta detenido.': 'Astronaut stopped.',
  'Lo que falta': 'Remaining journey', 'Lo que falta del viaje': 'Remaining journey',
  'Signos vitales': 'Vital signs', 'Vitales': 'Vitals', 'Simulado': 'Simulated',
  'Pulso': 'Heart rate', 'Temperatura': 'Temperature', 'Saturación de O₂': 'O₂ saturation',
  'Crítico': 'Critical', 'Aviso': 'Warning', 'Info': 'Info', 'Alertas': 'Alerts',
  'Pantalla completa': 'Full screen', 'Salir de pantalla completa': 'Exit full screen',
  'Mantén apretado, o usa WASD, las flechas o un joystick.': 'Press and hold, or use WASD, arrow keys, or a gamepad.',
  'Joystick: arrastra para caminar': 'Joystick: drag to walk',
  'Puntos a visitar, en orden': 'Places to visit, in order',
  'Punto': 'Point', 'de': 'of', 'Hasta': 'To', 'Salida': 'Trip',
  'Llegaste al máximo de': 'You reached the maximum of', 'puntos.': 'places.',
  'Control manual': 'Manual control', 'Modo de control': 'Control mode',
  'Minimapa del recorrido': 'Journey minimap',
  'Minimapa con el recorrido completo y la posición del astronauta': 'Minimap with the full route and astronaut position',
  'El control desde el teléfono funciona con la interfaz corriendo en un computador (': 'Phone control works when the app runs on a computer (',
  '). Aquí solo sirve otra ventana de este navegador. Código:': '). Here, only another window of this browser can serve as a controller. Code:',
  'Para usar el teléfono, arranca la interfaz con': 'To use your phone, start the app with',
  '. Código de esta demo:': '. Demo code:',
  'Tramo actual:': 'Current segment:',
  'Vista general del cráter, unos 6 m por píxel.': 'Crater overview, about 6 m per pixel.',
  'Detalle de menos de 1 m por píxel. Se ve al acercarse.': 'Detail finer than 1 m per pixel. Visible when zooming in.',
  'no hay camino transitable en el terreno': 'no traversable path across the terrain',
  'no alcanza el oxígeno para volver con reserva': 'insufficient oxygen to return with reserve',
  'El análisis del terreno no está configurado.': 'Terrain analysis is not configured.',
  'El monitoreo no está configurado.': 'Monitoring is not configured.',
  'El servidor no tiene el monitoreo disponible.': 'Monitoring is unavailable on the server.',
  'lpm ·': 'bpm ·',
  'menos de': 'less than',
  'vuelve al aterrizaje a recargar oxígeno': 'returns to landing to refill oxygen',
  'Nombre del punto': 'Place name', 'Subir': 'Move up', 'Bajar': 'Move down', 'Quitar': 'Remove',
  'preparando el viaje': 'planning the journey', 'caminata en curso': 'walk in progress',
  'Buscando la demo': 'Looking for demo', 'caminando': 'walking', 'en pausa': 'paused',
  'Cerrar alerta:': 'Dismiss alert:',
  'Código QR:': 'QR code:',
  'El oxígeno no alcanza para volver': 'There is not enough oxygen to return',
  'El oxígeno ya no cubre el margen de regreso ni la reserva': 'Oxygen no longer covers the return margin and reserve',
  'Conviene revisar el oxígeno y la ruta de regreso': 'Check oxygen and the return route',
  'Llegaste': 'Arrived', 'de la salida': 'on trip', 'Pendiente hacia': 'Slope towards',
  'lpm': 'bpm', 'pendiente fuerte': 'steep slope', 'terreno irregular': 'uneven terrain',
  'Aterrizaje (recarga)': 'Landing (refill)',
  'Mapa de calor · THEMIS IR': 'Heat map · THEMIS IR',
  'Infrarrojo diurno en falso color; intensidad relativa, no temperatura en °C.': 'False color daytime infrared; relative intensity, not temperature in °C.',
  'Ruta exploratoria: incluye pendientes superiores al 25 %. Revisa la viabilidad de esos tramos sobre el DEM.': 'Exploratory route: includes slopes above 25%. Check whether those segments are traversable on the DEM.',
  'Ese punto está fuera del tramo de la demo.': 'That point is outside the demo area.',
  'Esta ruta no se puede monitorear: el análisis no devolvió un idRuta (la ruta tiene que volver al aterrizaje y calcularse con /api/plan).': 'This route cannot be monitored: analysis did not return a route ID (the route must return to landing and be calculated with /api/plan).',
  'No se encontró el DEM de Gale': 'Gale DEM was not found',
  'La ruta necesita puntos en longitud y latitud': 'The route needs longitude and latitude points',
  'Cada punto de Gale debe ser [longitud, latitud]': 'Each Gale point must be [longitude, latitude]',
  'La ruta de Gale debe permanecer dentro de la cobertura del DEM': 'The Gale route must stay within DEM coverage',
  'El DEM no contiene elevaciones en esta área': 'The DEM has no elevation data for this area',
  'Ruta desconocida': 'Unknown route',
  'Solicitud demasiado grande o vacía': 'Request too large or empty',
  'Se esperaba un objeto JSON': 'Expected a JSON object',
  'La llegada y los puntos por visitar deben estar separados al menos 1 m': 'Landing and visit points must be at least 1 m apart',
  'No se pudo ordenar los puntos conectados': 'Could not order the connected points',
  'No se pudieron identificar todas las visitas en la ruta': 'Could not identify all visits in the route',
  'No se encontró una división que conserve la reserva de oxígeno': 'Could not split the route while preserving the oxygen reserve',
  'No se encontró una ruta de regreso transitable': 'No traversable return route was found',
  'La ruta pasa por una zona sin datos de elevación': 'The route crosses an area without elevation data',
  'La reserva de oxígeno ocupa todo el tanque': 'The oxygen reserve takes up the entire tank',
}

export const idiomaActual = () => idioma
export function cambiarIdioma(nuevo) {
  if (!opciones.has(nuevo)) return
  idioma = nuevo
  localStorage.setItem('martian-map-idioma', idioma)
  document.documentElement.lang = idioma
  document.title = idioma === 'en' ? 'Martian Map — Interface' : 'Martian Map — Interfaz'
  const url = new URL(window.location.href)
  if (idioma === 'en') url.searchParams.set('lang', 'en')
  else url.searchParams.delete('lang')
  window.history.replaceState(null, '', url)
}
export function tr(texto) {
  if (idioma !== 'en' || typeof texto !== 'string') return texto
  if (ingles[texto]) return ingles[texto]
  const oxigeno = texto.match(/^(\d+) g en (\d+) salidas, tanque de (\d+) g$/)
  if (oxigeno) return `${oxigeno[1]} g across ${oxigeno[2]} trips, ${oxigeno[3]} g tank`
  const tanque = texto.match(/^(\d+) g de (\d+) g$/)
  if (tanque) return `${tanque[1]} g of ${tanque[2]} g`
  const maximo = texto.match(/^Máximo (\d+) puntos a visitar\. Quita uno para agregar otro\.$/)
  if (maximo) return `Maximum ${maximo[1]} places to visit. Remove one to add another.`
  const conexion = texto.match(/^No se pudo conectar con el servidor \((.+)\)\. Revisa tu conexión\.$/)
  if (conexion) return `Could not connect to the server (${conexion[1]}). Check your connection.`
  const espera = texto.match(/^El servidor \((.+)\) no respondió en (\d+) s\.$/)
  if (espera) return `The server (${espera[1]}) did not respond within ${espera[2]} s.`
  const respuesta = texto.match(/^El servidor respondió (\d+)$/)
  if (respuesta) return `The server responded ${respuesta[1]}`
  const oxigenoMock = texto.match(/^No alcanza el oxígeno: la ruta necesita (\d+) %\. Quita o acerca algún punto\.$/)
  if (oxigenoMock) return `Not enough oxygen: the route needs ${oxigenoMock[1]}%. Remove or move a place closer.`
  if (texto.startsWith('Ninguna visita es alcanzable')) return texto.replace('Ninguna visita es alcanzable', 'No visit is reachable')
  const visitas = texto.match(/^Se requieren entre 1 y (\d+) puntos por visitar$/)
  if (visitas) return `Between 1 and ${visitas[1]} places to visit are required`
  const signos = [
    [/^Pulso muy alto: (.+) latidos\/min$/, 'Very high heart rate: $1 bpm'],
    [/^Sobreesfuerzo: pulso de (.+) latidos\/min$/, 'Overexertion: heart rate $1 bpm'],
    [/^Temperatura corporal muy alta: (.+) °C$/, 'Very high body temperature: $1 °C'],
    [/^Temperatura corporal alta: (.+) °C$/, 'High body temperature: $1 °C'],
    [/^Temperatura corporal muy baja: (.+) °C$/, 'Very low body temperature: $1 °C'],
    [/^Temperatura corporal baja: (.+) °C$/, 'Low body temperature: $1 °C'],
    [/^Saturación de oxígeno muy baja: (.+) %$/, 'Very low oxygen saturation: $1 %'],
    [/^Saturación de oxígeno baja: (.+) %$/, 'Low oxygen saturation: $1 %'],
  ]
  for (const [patron, ingles] of signos) if (patron.test(texto)) return texto.replace(patron, ingles)
  return texto
}
export const trPunto = (nombre) => tr(nombre?.replace(/^(?:Punto|Point) (\d+)$/, (_, n) => `${tr('Punto')} ${n}`))
