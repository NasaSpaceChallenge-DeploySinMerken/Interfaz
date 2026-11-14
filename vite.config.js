import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Control de la demo desde el teléfono (src/control/):
// - reenvía los mensajes entre la demo y el teléfono a todos los navegadores
//   conectados al servidor de desarrollo;
// - /__direcciones-red devuelve las direcciones de red del servidor, para que la
//   demo muestre la dirección exacta que hay que abrir en el teléfono.
// Para que el teléfono llegue, hay que arrancar con: npm run dev -- --host
function controlRemoto() {
  const EVENTO = 'martian-map-control'
  return {
    name: 'control-remoto',
    configureServer(server) {
      server.ws.on(EVENTO, (mensaje) => server.ws.send(EVENTO, mensaje))
      server.middlewares.use('/__direcciones-red', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ red: server.resolvedUrls?.network ?? [] }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), controlRemoto()],
})
