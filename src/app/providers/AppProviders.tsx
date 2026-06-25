import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { services } from '../composition-root'
import { ServicesProvider } from './ServicesProvider'
import { PreferencesProvider } from './PreferencesProvider'
import { AuthProvider } from './AuthProvider'
import { NotificationBridge } from './NotificationBridge'
import { UpdatePrompt } from './UpdatePrompt'

/** Single composition of every global provider, mounted once at the app root.
 * `PreferencesProvider` sits inside the store contexts so it can apply the user's saved
 * preferences to the running app — appearance theme, MotionConfig (reduced-motion), and
 * the haptics flag. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>
        <PreferencesProvider>
          <AuthProvider>{children}</AuthProvider>
        </PreferencesProvider>
        <NotificationBridge />
        <UpdatePrompt />
        <Toaster position="top-center" richColors theme="system" />
      </ServicesProvider>
    </I18nextProvider>
  )
}
