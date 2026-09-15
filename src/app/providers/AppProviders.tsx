import { type ReactNode, useMemo } from 'react'
import { Toaster } from 'sonner'
import type { PersistedAuth } from '@/shared/api'
import { useSessionStore } from '@/entities/session'
import type { Services } from '../composition-root'
import { ServicesProvider } from './ServicesProvider'
import { PreferencesProvider } from './PreferencesProvider'
import { AuthProvider } from './AuthProvider'
import { ScheduledDeletionGate } from './ScheduledDeletionGate'
import { NotificationBridge } from './NotificationBridge'
import { SyncProvider } from './SyncProvider'
import { UpdatePrompt } from './UpdatePrompt'

function AppSync({ services, children }: { services: Services; children: ReactNode }) {
  const session = useSessionStore((state) => state.session)
  const auth = useMemo<PersistedAuth | null>(
    () => (session ? { id: session.id, kind: session.kind } : null),
    [session],
  )
  return (
    <SyncProvider
      syncManager={services.syncManager}
      cloudSync={services.cloudSync}
      auth={auth}
      resetLocal={services.resetLocalData}
      storage={services.storage}
    >
      {children}
    </SyncProvider>
  )
}

export function AppProviders({ services, children }: { services: Services; children: ReactNode }) {
  return (
    <ServicesProvider services={services}>
      <PreferencesProvider>
        <AuthProvider>
          <AppSync services={services}>
            <ScheduledDeletionGate>{children}</ScheduledDeletionGate>
          </AppSync>
        </AuthProvider>
      </PreferencesProvider>
      <NotificationBridge />
      <UpdatePrompt />
      <Toaster
        position="top-center"
        richColors
        theme="system"
        mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        style={{ zIndex: 'var(--z-toast)' }}
      />
    </ServicesProvider>
  )
}
