import { useCallback, useEffect, useState } from 'react'
import type { PersistedAuth, RemoteChangeEvent, StoragePort } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import { type DataOwner, resolveDataTransition, selectIsReady, useLatest } from '@/shared/lib'
import { useDeckStoreApi } from '@/entities/deck'
import { useProfileStoreApi } from '@/entities/profile'
import {
  selectPendingCount,
  usePendingChangeStore,
  usePendingChangeStoreApi,
} from '@/entities/pending-change'
import { applyDataTransition, useAuthActions } from '@/features/session'
import { reconcileInlineImages } from '@/features/media'

export interface DataTransitionDeps {
  syncManager: Pick<SyncManager, 'start' | 'stop'> | null
  auth: PersistedAuth | null
  resetLocal: () => Promise<void>
  storage: StoragePort
  dataOwner: DataOwner
  onRemoteChange: (event: RemoteChangeEvent) => void
}

export interface UnsyncedReset {
  /** How many changes the previous account never synchronised. */
  count: number
  /** Erase them and continue into the account that just signed in. */
  proceed: () => Promise<void>
  /** Sign back out, so the previous account can sign in and Synchronise first. */
  cancel: () => Promise<void>
}

export interface DataTransition {
  /**
   * The account the cloud watcher is open for, or null while nothing is — before the transition has
   * settled, while the unsynced-reset question waits, and for a guest. This is what tells the
   * provider a Sync may run at all: a cycle asked for before `start` has no account to push as.
   */
  watchingFor: string | null
  /** The question a wipe is waiting on, or null. */
  unsyncedReset: UnsyncedReset | null
}

/**
 * What happens to the device's data when an account signs in, and the watcher for as long as it
 * stays signed in.
 *
 * A different account signing in wipes the device. With Sync manual, that device may be holding
 * weeks of the previous account's work — and nothing can push it now, because that account's
 * session is gone and a push would carry its decks into the new one. So the wipe is not silent: when
 * the log is not empty, it waits for an answer, and the answer the person can act on is to sign out,
 * sign back into the previous account, and Synchronise.
 */
export function useDataTransition({
  syncManager,
  auth,
  resetLocal,
  storage,
  dataOwner,
  onRemoteChange,
}: DataTransitionDeps): DataTransition {
  const deckStore = useDeckStoreApi()
  const profileStore = useProfileStoreApi()
  const pendingChangeStore = usePendingChangeStoreApi()
  const pendingReady = usePendingChangeStore(selectIsReady)
  const { signOut } = useAuthActions()
  const [unsynced, setUnsynced] = useState<{ count: number; userId: string } | null>(null)
  const [watchingFor, setWatchingFor] = useState<string | null>(null)

  // Held in a ref so a new callback identity does not tear down and restart the watcher.
  const remoteChange = useLatest(onRemoteChange)

  useEffect(() => {
    if (!syncManager || auth?.kind !== 'account' || !pendingReady) return
    const userId = auth.id
    const transition = resolveDataTransition(dataOwner.read(), userId)

    // Read once the log has mirrored — before that an empty log means "not loaded", not "nothing
    // pending", and treating the two alike is exactly how weeks of work would be erased unasked.
    const count = selectPendingCount(pendingChangeStore.getState())
    if (transition === 'reset' && count > 0) {
      setUnsynced({ count, userId })
      return
    }

    let live = true
    void (async () => {
      await applyDataTransition({
        transition,
        userId,
        syncManager,
        dataOwner,
        resetLocal,
        onRemoteChange: (event) => remoteChange.current(event),
      })
      // A reset reloads the page; nothing on this one is worth reconciling.
      if (transition === 'reset') return
      if (live) setWatchingFor(userId)
      // Photos picked offline are still inline; this is the first connected moment to move them.
      await reconcileInlineImages({ profileStore, deckStore, storage, userId })
    })()

    return () => {
      live = false
      setWatchingFor(null)
      void syncManager.stop()
    }
  }, [
    syncManager,
    auth,
    pendingReady,
    resetLocal,
    storage,
    deckStore,
    profileStore,
    pendingChangeStore,
    dataOwner,
    remoteChange,
  ])

  const proceed = useCallback(async () => {
    if (!syncManager || !unsynced) return
    await applyDataTransition({
      transition: 'reset',
      userId: unsynced.userId,
      syncManager,
      dataOwner,
      resetLocal,
    })
  }, [syncManager, unsynced, dataOwner, resetLocal])

  const cancel = useCallback(async () => {
    setUnsynced(null)
    await signOut()
  }, [signOut])

  return {
    watchingFor,
    unsyncedReset: unsynced ? { count: unsynced.count, proceed, cancel } : null,
  }
}
