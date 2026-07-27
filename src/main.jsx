import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.scss'
import App from './App.jsx'

// The build injects a prerendered copy of the landing page for crawlers and link previews.
// React renders the same content itself, so drop the static copy before the first paint.
document.getElementById('prerender')?.remove()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)