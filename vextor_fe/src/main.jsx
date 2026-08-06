import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/i18n.js'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
