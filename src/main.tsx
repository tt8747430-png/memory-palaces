import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Bootstrap } from './app/Bootstrap'
import { startTopInset } from './shared/lib'
import './styles/index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

// Before the first render: the splash is the first screen that sits under the clock.
startTopInset()

createRoot(rootEl).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
