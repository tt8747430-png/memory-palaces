import { I18nextProvider } from 'react-i18next'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'
import { i18n } from '@/shared/i18n'
import { ServicesProvider } from '@/shell/services-provider'
import { ThemeProvider } from '@/shell/theme-provider'
import type { Services } from '@/composition-root'
import { router } from '@/routes'
import { OverlayHost } from '@/shared/ui'

export function App({ services }: { services: Services }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>
        <ThemeProvider>
          <RouterProvider router={router} />
          <OverlayHost />
          {/* Sonner defaults to z-index 999999999 — bring it into the token scale so the
              status-bar cap (z-statusbar) stays the topmost element at the top edge: iOS
              samples the bar tint from a hit test there, so a toast sliding through the
              forehead must sit under the cap for the bar to stay navy. */}
          <Toaster
            position="top-center"
            richColors
            mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
            style={{ zIndex: 'var(--ms-z-toast)' }}
          />
        </ThemeProvider>
      </ServicesProvider>
    </I18nextProvider>
  )
}
