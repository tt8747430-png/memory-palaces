import { useCallback, useEffect, useState } from 'react'
import type { PersistedAuth, RemoteChangeEvent, StoragePort } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import type { SyncedTable } from '@/shared/config/sync-tables'
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
  /**
   * The tables live right now. Handed to `start`, so toggling an extension re-runs the transition
   * and the watcher comes back over the new set — the list is read here, not merely depended on.
   */
  tables: readonly SyncedTable[]
}

export interface UnsyncedReset {
  count: number
  proceed: () => Promise<void>
  cancel: () => Promise<void>
}

export interface DataTransition {
  watchingFor: string | null
  unsyncedReset: UnsyncedReset | null
}

export function useDataTransition({
  syncManager,
  auth,
  resetLocal,
  storage,
  dataOwner,
  onRemoteChange,
  tables,
}: DataTransitionDeps): DataTransition {
  const deckStore = useDeckStoreApi()
  const profileStore = useProfileStoreApi()
  const pendingChangeStore = usePendingChangeStoreApi()
  const pendingReady = usePendingChangeStore(selectIsReady)
  const { signOut } = useAuthActions()
  const [unsynced, setUnsynced] = useState<{ count: number; userId: string } | null>(null)
  const [watchingFor, setWatchingFor] = useState<string | null>(null)

  const remoteChange = useLatest(onRemoteChange)

  useEffect(() => {
    if (!syncManager || auth?.kind !== 'account' || !pendingReady) return
    const userId = auth.id
    const transition = resolveDataTransition(dataOwner.read(), userId)

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
        tables,
        dataOwner,
        resetLocal,
        onRemoteChange: (event) => remoteChange.current(event),
      })
      if (transition === 'reset') return
      if (live) setWatchingFor(userId)
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
    tables,
  ])

  const proceed = useCallback(async () => {
    if (!syncManager || !unsynced) return
    await applyDataTransition({
      transition: 'reset',
      userId: unsynced.userId,
      syncManager,
      tables,
      dataOwner,
      resetLocal,
    })
  }, [syncManager, unsynced, tables, dataOwner, resetLocal])

  const cancel = useCallback(async () => {
    setUnsynced(null)
    await signOut()
  }, [signOut])

  return {
    watchingFor,
    unsyncedReset: unsynced ? { count: unsynced.count, proceed, cancel } : null,
  }
}
