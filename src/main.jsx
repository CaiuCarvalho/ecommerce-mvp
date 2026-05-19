import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSentry } from './lib/sentry'
import { reportWebVitals } from './lib/webVitals'

// Inicializa error tracking antes de qualquer render
initSentry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Coleta Web Vitals após o render (não bloqueia o paint)
reportWebVitals()
