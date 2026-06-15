import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { Toaster } from 'sonner'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { services } from '../composition-root'
import { ServicesProvider } from './ServicesProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'

/** Single composition of every global provider, mounted once at the app root.
 * `MotionConfig reducedMotion="user"` makes every animation honor the OS setting. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <MotionConfig reducedMotion="user">
        <ThemeProvider theme="light">
          <ServicesProvider services={services}>
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="top-center" richColors />
          </ServicesProvider>
        </ThemeProvider>
      </MotionConfig>
    </I18nextProvider>
  )
}
