import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/main.scss'
import App from './App.jsx'
import ErrorFallback from './components/layout/ErrorFallback'
import { initSentry } from './utils/sentry'

initSentry()

// The build injects a prerendered copy of the landing page for crawlers and link previews.
// React renders the same content itself, so drop the static copy before the first paint.
document.getElementById('prerender')?.remove()

// Outside <App/> on purpose: the providers and the router are inside it, and a boundary
// below them can't catch a throw from the providers themselves.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
