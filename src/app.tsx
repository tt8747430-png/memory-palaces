import { I18nextProvider } from 'react-i18next'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'
import { i18n } from '@/shared/i18n'
import { ServicesProvider } from '@/shell/services-provider'
import { ThemeProvider } from '@/shell/theme-provider'
import { KeyboardInsetProvider } from '@/shell/keyboard-inset-provider'
import type { Services } from '@/composition-root'
import { router } from '@/routes'
import { OverlayHost } from '@/shared/ui'

export function App({ services }: { services: Services }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>
        <ThemeProvider>
          <KeyboardInsetProvider>
            <RouterProvider router={router} />
            <OverlayHost />
            <Toaster
              position="top-center"
              richColors
              mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
            />
          </KeyboardInsetProvider>
        </ThemeProvider>
      </ServicesProvider>
    </I18nextProvider>
  )
}
