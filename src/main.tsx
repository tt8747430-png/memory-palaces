import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { initNativeShell } from './app/native'
import './styles/index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

// Native-shell setup (hides the iOS keyboard accessory bar); a no-op on web.
void initNativeShell()

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
