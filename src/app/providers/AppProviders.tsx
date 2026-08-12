import { type ReactNode, useMemo } from 'react'
import { Toaster } from 'sonner'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import type { PersistedAuth } from '@/shared/api'
import { useSessionStore } from '@/entities/session'
import { services } from '../composition-root'
import { ServicesProvider } from './ServicesProvider'
import { PreferencesProvider } from './PreferencesProvider'
import { AuthProvider } from './AuthProvider'
import { NotificationBridge } from './NotificationBridge'
import { SyncProvider } from './SyncProvider'
import { UpdatePrompt } from './UpdatePrompt'

/** Replication follows the session store's identity — a guest's data never leaves the device. */
function AppSync({ children }: { children: ReactNode }) {
  const session = useSessionStore((state) => state.session)
  const auth = useMemo<PersistedAuth | null>(
    () => (session ? { id: session.id, kind: session.kind } : null),
    [session],
  )
  return (
    <SyncProvider
      syncManager={services.syncManager}
      auth={auth}
      resetLocal={services.resetLocalData}
    >
      {children}
    </SyncProvider>
  )
}

/** Above every dialog and dropdown (500), below the splash (700). */
const TOAST_LAYER = 600

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ServicesProvider services={services}>
        <PreferencesProvider>
          <AuthProvider>
            <AppSync>{children}</AppSync>
          </AuthProvider>
        </PreferencesProvider>
        <NotificationBridge />
        <UpdatePrompt />
        {/* Mounted from the first render: sonner drops anything published before
            a Toaster subscribes, and the splash covers this one until it lifts. */}
        <Toaster
          position="top-center"
          richColors
          theme="system"
          mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
          style={{ zIndex: TOAST_LAYER }}
        />
      </ServicesProvider>
    </I18nextProvider>
  )
}
