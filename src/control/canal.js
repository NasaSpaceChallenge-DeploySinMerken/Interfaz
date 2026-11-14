// Canal entre la demo y el control remoto (#control).
//
// Usa varios caminos a la vez:
// - BroadcastChannel: pestañas o ventanas del mismo navegador (funciona siempre).
// - Servidor de Vite (solo con npm run dev): otros dispositivos, como un celular.
//   El plugin de vite.config.js reenvía los mensajes a todos los conectados.
// - Servidor propio de la interfaz (npm run build:servidor + npm start): otros
//   dispositivos en la versión publicada. Se publica con POST /control/:sesion y
//   se recibe con GET /control/:sesion/eventos (servidor/index.js).
//
// Como al servidor pueden estar conectadas varias demos (la tuya, la de Pamela…),
// cada demo tiene un código de sesión de 4 dígitos y el control solo habla con
// la demo de su código.
//
// Cada mensaje lleva `origen` ('demo' o 'control') y `sesion` (el código).
// Mensajes:
//   control → demo: { tipo: 'hola' }                 (cada 1 s, para saber que está)
//                   { tipo: 'direccion', x, y }      (x: este, y: norte; 0, 0 al soltar)
//                   { tipo: 'modo', modo }           ('auto' | 'manual')
//                   { tipo: 'velocidad', valor }     (1 | 10 | 60)
//                   { tipo: 'accion', accion }       ('iniciar' | 'pausar' | 'reiniciar')
//   demo → control: { tipo: 'estado', posicion, rumbo, modo, enMarcha, velocidad,
//                     terminado, proxima, restante, alertas, t }

const NOMBRE = 'martian-map-control'
const SERVIDOR_PROPIO = import.meta.env.VITE_SERVIDOR === 'propio'
const CONTROL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/control`

// `sesion`: código con el que se filtran los mensajes. Con null se reciben todos
// (lo usa el control para listar las demos disponibles).
export function abrirCanal(rol, sesion, alRecibir) {
  const recibir = (msg) => {
    if (!msg || msg.origen === rol) return
    if (sesion && msg.sesion !== sesion) return
    alRecibir(msg)
  }

  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(NOMBRE) : null
  const alMensaje = (e) => recibir(e.data)
  bc?.addEventListener('message', alMensaje)

  const hot = import.meta.hot
  hot?.on(NOMBRE, recibir)

  // servidor propio: con sesión se escuchan sus mensajes; sin sesión (el control
  // eligiendo demo) se consulta cada 1,5 s la lista de demos activas
  let fuente = null
  let sondeo = null
  if (SERVIDOR_PROPIO) {
    if (sesion) {
      fuente = new EventSource(`${CONTROL}/${sesion}/eventos`)
      fuente.onmessage = (e) => {
        try {
          recibir(JSON.parse(e.data))
        } catch {
          // mensaje que no es JSON: se ignora
        }
      }
    } else {
      const listar = async () => {
        try {
          const r = await fetch(`${CONTROL}/demos`, { cache: 'no-store' })
          const { demos } = await r.json()
          demos.forEach((d) => recibir(d.estado))
        } catch {
          // sin conexión: se reintenta en la próxima vuelta
        }
      }
      listar()
      sondeo = setInterval(listar, 1500)
    }
  }

  return {
    enviar(msg, sesionDestino = sesion) {
      const completo = { ...msg, origen: rol, sesion: sesionDestino }
      bc?.postMessage(completo)
      hot?.send(NOMBRE, completo)
      if (SERVIDOR_PROPIO && sesionDestino) {
        fetch(`${CONTROL}/${sesionDestino}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completo),
          keepalive: true,
        }).catch(() => {})
      }
    },
    cerrar() {
      bc?.removeEventListener('message', alMensaje)
      bc?.close()
      hot?.off?.(NOMBRE, recibir)
      fuente?.close()
      clearInterval(sondeo)
    },
  }
}

export const nuevoCodigo = () => String(Math.floor(1000 + Math.random() * 9000))

// ¿Esta pestaña es el control remoto? (#control o #control=1234)
export const esControlRemoto = () => window.location.hash.startsWith('#control')

export const codigoEnDireccion = () => {
  const m = window.location.hash.match(/^#control=(\d{4})$/)
  return m ? m[1] : null
}
