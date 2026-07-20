import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createServices } from '@/composition-root'
import { App } from '@/app'
import '@/shared/i18n'
import '@/styles/index.css'

// Offline-first: the on-device RxDB is the ONLY copy of the learner's data. Ask the browser
// to exempt it from storage-pressure eviction (auto-granted for installed PWAs on Chromium;
// Safari grants for home-screen apps). Fire-and-forget — denial just means default eviction rules.
void navigator.storage?.persist?.()

// Installed app only: lock pinch-zoom (ADR-0010). The browser tab stays zoomable (WCAG 1.4.4);
// the standalone app is gesture-heavy and an accidental pinch mid-swipe reads as breakage.
if (matchMedia('(display-mode: standalone)').matches) {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=resizes-visual',
    )
}

const services = await createServices()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
)
