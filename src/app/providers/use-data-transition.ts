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
  /** `undefined` while the session is still being restored — not known, which is not signed out. */
  auth: PersistedAuth | null | undefined
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

/**
 * Where the signed-in account's data transition stands. `deciding` — the pending log has not
 * loaded, so whether switching would lose unsynced work is not known yet. `asking` — it would, and
 * the learner is being asked. `settled` — applied, or nothing to decide (no account, no cloud).
 */
export type TransitionStatus = 'deciding' | 'asking' | 'settled'

export interface DataTransition {
  watchingFor: string | null
  status: TransitionStatus
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
  const pendingCount = usePendingChangeStore(selectPendingCount)
  const { signOut } = useAuthActions()
  const [watchingFor, setWatchingFor] = useState<string | null>(null)

  const remoteChange = useLatest(onRemoteChange)

  // The account whose question the learner has just answered "sign out" to. The dialog closes at
  // once rather than waiting on the sign-out round-trip, and a second tap cannot sign out twice.
  const [leaving, setLeaving] = useState<string | null>(null)

  const accountId = syncManager && auth?.kind === 'account' ? auth.id : null
  // Switching this device to another account clears it, so work that never reached the cloud is
  // asked about first. Derived rather than set from the effect: the render that first knows the
  // answer already shows the question, so nothing raised meanwhile — a first Sync's splash — can
  // cover it.
  const asking =
    accountId !== null &&
    pendingReady &&
    pendingCount > 0 &&
    resolveDataTransition(dataOwner.read(), accountId) === 'reset'
  const status: TransitionStatus =
    accountId === null ? 'settled' : !pendingReady ? 'deciding' : asking ? 'asking' : 'settled'

  useEffect(() => {
    if (!syncManager || auth?.kind !== 'account' || !pendingReady || asking) return
    const userId = auth.id
    const transition = resolveDataTransition(dataOwner.read(), userId)

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
    asking,
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
    if (!syncManager || !accountId) return
    await applyDataTransition({
      transition: 'reset',
      userId: accountId,
      syncManager,
      tables,
      dataOwner,
      resetLocal,
    })
  }, [syncManager, accountId, tables, dataOwner, resetLocal])

  const cancel = useCallback(async () => {
    setLeaving(accountId)
    try {
      await signOut()
    } finally {
      setLeaving(null)
    }
  }, [accountId, signOut])

  return {
    watchingFor,
    status,
    unsyncedReset:
      asking && leaving !== accountId ? { count: pendingCount, proceed, cancel } : null,
  }
}
