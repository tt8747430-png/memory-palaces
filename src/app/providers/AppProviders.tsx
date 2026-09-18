import { type ReactNode, useMemo } from 'react'
import { Toaster } from 'sonner'
import type { PersistedAuth } from '@/shared/api'
import { useSessionStore } from '@/entities/session'
import type { Services } from '../composition-root'
import { ExtensionsProvider } from '../extensions/ExtensionsProvider'
import { EXTENSIONS } from '../extensions/registry'
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
      syncTables={services.syncTables}
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
            <ScheduledDeletionGate>
              <ExtensionsProvider manifests={EXTENSIONS}>{children}</ExtensionsProvider>
            </ScheduledDeletionGate>
          </AppSync>
        </AuthProvider>
      </PreferencesProvider>
      <NotificationBridge />
      <UpdatePrompt />
      <Toaster
        position="bottom-center"
        richColors
        theme="system"
        offset={{ bottom: 'var(--toast-inset)' }}
        mobileOffset={{ bottom: 'var(--toast-inset)' }}
        style={{ zIndex: 'var(--z-toast)' }}
      />
    </ServicesProvider>
  )
}
