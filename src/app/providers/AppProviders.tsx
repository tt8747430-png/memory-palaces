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
        {/* Keep the toaster clear of the iOS status-bar safe area. Sonner's container is a
            full-width fixed element anchored 16px below the viewport top with a huge z-index;
            left at the default it intrudes under the status bar, and iOS (standalone PWA)
            re-tints the bar from that topmost transparent layer — repainting it white. */}
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
