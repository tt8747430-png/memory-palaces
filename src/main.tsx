import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/index.css'
// Reads the web app manifest and, on iOS Safari, generates the apple-touch-startup-image
// (launch screen) and apple-touch-icon at runtime — sized to the actual device, as inline
// data URIs. Replaces hand-maintained per-device <link> tags, which can't 404 or miss a
// device this way. https://github.com/GoogleChromeLabs/pwacompat
import 'pwacompat'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
