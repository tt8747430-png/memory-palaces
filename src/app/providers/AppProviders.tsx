import { type ReactNode, useMemo } from 'react'
import { Toaster } from 'sonner'
import type { PersistedAuth } from '@/shared/api'
import { selectIsReady, useColorScheme } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import type { Services } from '../composition-root'
import { ExtensionsProvider } from '../extensions/ExtensionsProvider'
import { ServicesProvider } from './ServicesProvider'
import { PreferencesProvider } from './PreferencesProvider'
import { AuthProvider } from './AuthProvider'
import { ScheduledDeletionGate } from './ScheduledDeletionGate'
import { NotificationBridge } from './NotificationBridge'
import { SyncProvider } from './SyncProvider'
import { UpdatePrompt } from './UpdatePrompt'

function AppSync({ services, children }: { services: Services; children: ReactNode }) {
  const session = useSessionStore((state) => state.session)
  const restored = useSessionStore(selectIsReady)
  // Undefined until the session is restored: "not known yet" must not read as "signed out".
  const auth = useMemo<PersistedAuth | null | undefined>(
    () => (!restored ? undefined : session ? { id: session.id, kind: session.kind } : null),
    [restored, session],
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

/**
 * The learner's theme, not the OS's: sonner's `theme="system"` lights the toasts from
 * `prefers-color-scheme` and hands a dark app a white toast. It subscribes here rather than in
 * `AppProviders` so a theme change repaints the toasts alone, not every provider in the tree.
 */
function ThemedToaster() {
  const scheme = useColorScheme()
  return (
    <Toaster
      position="bottom-center"
      richColors
      theme={scheme}
      offset={{ bottom: 'var(--toast-inset)' }}
      mobileOffset={{ bottom: 'var(--toast-inset)' }}
      style={{ zIndex: 'var(--z-toast)' }}
    />
  )
}

export function AppProviders({ services, children }: { services: Services; children: ReactNode }) {
  return (
    <ServicesProvider services={services}>
      <PreferencesProvider>
        <AuthProvider>
          <AppSync services={services}>
            <ScheduledDeletionGate>
              <ExtensionsProvider runtime={services.extensions}>{children}</ExtensionsProvider>
            </ScheduledDeletionGate>
          </AppSync>
        </AuthProvider>
      </PreferencesProvider>
      <NotificationBridge />
      <UpdatePrompt />
      <ThemedToaster />
    </ServicesProvider>
  )
}
