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

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>
        <PreferencesProvider>
          <AuthProvider>{children}</AuthProvider>
        </PreferencesProvider>
        <NotificationBridge />
        <UpdatePrompt />
        <Toaster
          position="top-center"
          richColors
          theme="system"
          mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        />
      </ServicesProvider>
    </I18nextProvider>
  )
}
