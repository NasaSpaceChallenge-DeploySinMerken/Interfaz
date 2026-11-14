import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Reenvía los mensajes del control remoto (src/control/canal.js) a todos los
// navegadores conectados al servidor de desarrollo. Así un celular en la misma
// red puede manejar al astronauta (npm run dev -- --host).
function controlRemoto() {
  const EVENTO = 'martian-map-control'
  return {
    name: 'control-remoto',
    configureServer(server) {
      server.ws.on(EVENTO, (mensaje) => server.ws.send(EVENTO, mensaje))
    },
  }
}

export default defineConfig({
  plugins: [react(), controlRemoto()],
})
