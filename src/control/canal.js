// Canal entre la demo y el control remoto (#control).
//
// Usa dos caminos a la vez:
// - BroadcastChannel: pestañas o ventanas del mismo navegador (funciona siempre).
// - Servidor de Vite (solo con npm run dev): otros dispositivos, como un celular.
//   El plugin de vite.config.js reenvía los mensajes a todos los conectados.
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

  return {
    enviar(msg, sesionDestino = sesion) {
      const completo = { ...msg, origen: rol, sesion: sesionDestino }
      bc?.postMessage(completo)
      hot?.send(NOMBRE, completo)
    },
    cerrar() {
      bc?.removeEventListener('message', alMensaje)
      bc?.close()
      hot?.off?.(NOMBRE, recibir)
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
