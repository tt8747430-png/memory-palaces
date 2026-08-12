import { type ReactNode, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { PersistedAuth, StoragePort } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import { type DataOwner, localDataOwner, resolveDataTransition } from '@/shared/lib'
import { useDeckStoreApi } from '@/entities/deck'
import { useProfileStoreApi } from '@/entities/profile'
import { applyDataTransition } from '@/features/session'
import { reconcileInlineImages } from '@/features/media'

export type SyncController = Pick<SyncManager, 'start' | 'flush' | 'stop'>

export interface SyncProviderProps {
  /** Null when no Supabase project is configured — the app then runs purely on-device. */
  syncManager: SyncController | null
  /** The current identity. A guest syncs nothing; their data is claimed when they sign up. */
  auth: PersistedAuth | null
  /** Wipes the on-device database when a different account signs in. */
  resetLocal: () => Promise<void>
  storage: StoragePort
  /** Whose data is on the device. Injected so a test can start from a chosen owner. */
  dataOwner?: DataOwner
  children?: ReactNode
}

/**
 * Runs the replication for as long as an account is signed in, decides what happens to the local
 * data when the identity changes, and gets the last writes out when the app is backgrounded or
 * closed — the moment on mobile where a tab is most likely to be killed before RxDB's own retry
 * loop would have pushed.
 */
export function SyncProvider({
  syncManager,
  auth,
  resetLocal,
  storage,
  dataOwner = localDataOwner,
  children,
}: SyncProviderProps) {
  const { t } = useTranslation()
  const deckStore = useDeckStoreApi()
  const profileStore = useProfileStoreApi()
  // Held in a ref so switching language does not tear down and restart every replication.
  const translate = useRef(t)
  useEffect(() => {
    translate.current = t
  }, [t])

  useEffect(() => {
    // Ask the browser not to evict the RxDB store; it is the source of truth, not a cache.
    void navigator.storage?.persist?.()
  }, [])

  useEffect(() => {
    if (!syncManager || auth?.kind !== 'account') return

    const userId = auth.id
    const transition = resolveDataTransition(dataOwner.read(), userId)
    void (async () => {
      await applyDataTransition({
        transition,
        userId,
        syncManager,
        dataOwner,
        resetLocal,
        onUnsyncedLoss: () => toast.error(translate.current('sync.unsyncedLoss')),
      })
      // A reset reloads the page; nothing on this one is worth reconciling.
      if (transition === 'reset') return
      // Photos picked offline are still inline; this is the first connected moment to move them.
      await reconcileInlineImages({ profileStore, deckStore, storage, userId })
    })()

    const flushOnLeave = () => {
      if (document.visibilityState === 'hidden') void syncManager.flush()
    }
    const flushNow = () => void syncManager.flush()

    document.addEventListener('visibilitychange', flushOnLeave)
    window.addEventListener('pagehide', flushNow)
    return () => {
      document.removeEventListener('visibilitychange', flushOnLeave)
      window.removeEventListener('pagehide', flushNow)
      void syncManager.stop()
    }
  }, [syncManager, auth, resetLocal, storage, deckStore, profileStore, dataOwner])

  return children
}
