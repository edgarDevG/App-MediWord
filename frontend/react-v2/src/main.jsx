

import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import './index.css'
import App from './App.jsx'

// StrictMode desactivado en dev para evitar doble montaje de useEffect
// Reactivar antes de producción: import { StrictMode } from 'react'
createRoot(document.getElementById('root')).render(
  <App />
)