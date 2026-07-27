import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { useSplashDone } from '@/shared/lib'
import { services } from '../composition-root'
import { ServicesProvider } from './ServicesProvider'
import { PreferencesProvider } from './PreferencesProvider'
import { AuthProvider } from './AuthProvider'
import { NotificationBridge } from './NotificationBridge'
import { UpdatePrompt } from './UpdatePrompt'

export function AppProviders({ children }: { children: ReactNode }) {
  // Toasts land at the very top of the screen, right where the splash is playing. Mounting the
  // toaster only once the overlay is gone means the launch is never interrupted — and, since
  // sonner only renders what is published after it mounts, anything raised during the splash is
  // dropped rather than queued to pile up the moment the learner arrives.
  const splashDone = useSplashDone()
  return (
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>
        <PreferencesProvider>
          <AuthProvider>{children}</AuthProvider>
        </PreferencesProvider>
        <NotificationBridge />
        <UpdatePrompt />
        {splashDone ? (
          <Toaster
            position="top-center"
            richColors
            theme="system"
            mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
          />
        ) : null}
      </ServicesProvider>
    </I18nextProvider>
  )
}
