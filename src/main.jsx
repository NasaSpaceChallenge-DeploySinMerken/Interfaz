import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { reservarCodigo } from './control/sesion'
import './style.css'

// primero el código único de esta demo (lo usan la planificación y la caminata)
reservarCodigo().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
