import { type ReactNode, useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { CloudSyncPort, PersistedAuth, RemoteChangeEvent, StoragePort } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import {
  type DataOwner,
  localDataOwner,
  nowIso,
  readOnline,
  type SyncOutcome,
  type SyncReviewDecision,
  type SyncReviewItem,
  type SyncRunner,
  SyncRunnerContext,
  useLatest,
} from '@/shared/lib'
import { useDeckStoreApi } from '@/entities/deck'
import { useCardStoreApi } from '@/entities/card'
import { useFolderStoreApi } from '@/entities/folder'
import { useQuestionStoreApi } from '@/entities/question'
import { usePendingChangeStoreApi } from '@/entities/pending-change'
import { useSyncStateStoreApi } from '@/entities/sync-state'
import {
  applyPendingDeletions,
  describeReviewItems,
  findReviewItems,
  noteCloudChange,
  type SyncDeps,
  syncNow,
} from '@/features/sync'
import { INITIAL_RUNNER_STATE, runnerReducer } from './sync-runner-state'
import { useAutosync } from './use-autosync'
import { useDataTransition } from './use-data-transition'
import { UnsyncedResetDialog } from './UnsyncedResetDialog'

export interface SyncProviderProps {
  /** Null when no Supabase project is configured — the app then runs purely on-device. */
  syncManager: Pick<SyncManager, 'start' | 'stop'> | null
  /** The cloud a Sync talks to. Null exactly when `syncManager` is. */
  cloudSync: CloudSyncPort | null
  /** The current identity. A guest syncs nothing; their data is claimed when they sign up. */
  auth: PersistedAuth | null
  /** Wipes the on-device database when a different account signs in. */
  resetLocal: () => Promise<void>
  storage: StoragePort
  /** Whose data is on the device. Injected so a test can start from a chosen owner. */
  dataOwner?: DataOwner
  children?: ReactNode
}

/** How long the banner's success state stays up before it dismisses itself. */
const SYNCED_MS = 2500

/**
 * The handle between a Sync and the screen: one runner in context, Autosync, and what the device's
 * data does when the identity changes.
 *
 * It does **not** replicate continuously. Nothing leaves the device until Synchronise is pressed,
 * or until Autosync — off by default, and a property of this device — asks. Classification lives in
 * `syncNow`, the replication lifecycle in `SyncManager`, Realtime in `CloudWatcher`; this provider
 * absorbs none of them.
 */
export function SyncProvider({
  syncManager,
  cloudSync,
  auth,
  resetLocal,
  storage,
  dataOwner = localDataOwner,
  children,
}: SyncProviderProps) {
  const deckStore = useDeckStoreApi()
  const cardStore = useCardStoreApi()
  const folderStore = useFolderStoreApi()
  const questionStore = useQuestionStoreApi()
  const pendingChangeStore = usePendingChangeStoreApi()
  const syncStateStore = useSyncStateStoreApi()
  const [state, dispatch] = useReducer(runnerReducer, INITIAL_RUNNER_STATE)

  /**
   * One Sync at a time. A second request — Autosync's reconnect landing on a pressed Synchronise —
   * joins the one running rather than peeking against checkpoints the first is about to move.
   */
  const inFlight = useRef<Promise<SyncOutcome> | null>(null)

  // While a Sync is in flight its own push echoes back over Realtime, and the peek after the cycle
  // is what tells an echo from news. Deciding here would light the banner at this device's own work.
  const onRemoteChange = useCallback(
    (event: RemoteChangeEvent) => {
      if (!inFlight.current) void noteCloudChange({ syncStateStore }, event)
    },
    [syncStateStore],
  )

  const { watchingFor, unsyncedReset } = useDataTransition({
    syncManager,
    auth,
    resetLocal,
    storage,
    dataOwner,
    onRemoteChange,
  })

  // Only once the watcher is open for *this* account. Before that — while the unsynced-reset
  // question is up, or the transition is still settling — there is no account to push as, and a
  // Sync that ran anyway would confirm a pending log nothing carried.
  const deps = useMemo<SyncDeps | null>(
    () =>
      cloudSync && auth?.kind === 'account' && watchingFor === auth.id
        ? {
            cloud: cloudSync,
            pendingChangeStore,
            syncStateStore,
            deckStore,
            folderStore,
            cardStore,
            questionStore,
            now: nowIso,
            isOnline: readOnline,
          }
        : null,
    [
      cloudSync,
      auth,
      watchingFor,
      pendingChangeStore,
      syncStateStore,
      deckStore,
      folderStore,
      cardStore,
      questionStore,
    ],
  )
  const depsRef = useLatest(deps)

  // The names come after the question: a review opens on ids alone, and the cloud's copies are
  // read for their names once it is open. A server read, so it lives here and not in the dialog.
  const describe = useCallback(
    (items: SyncReviewItem[]) => {
      const current = depsRef.current
      if (!current) return
      describeReviewItems(current, items).then(
        (rows) => dispatch({ type: 'reviewDescribed', items, rows }),
        () => dispatch({ type: 'reviewDescribeFailed', items }),
      )
    },
    [depsRef],
  )

  const runSync = useCallback(
    (phase: 'syncing' | 'restoring', work: (current: SyncDeps) => Promise<SyncOutcome>) => {
      const current = depsRef.current
      if (!current) return Promise.resolve<SyncOutcome>({ kind: 'offline' })
      inFlight.current ??= (async () => {
        dispatch({ type: 'started', phase })
        try {
          const outcome = await work(current)
          dispatch({ type: 'settled', outcome })
          if (outcome.kind === 'needs-review') describe(outcome.items)
          return outcome
        } finally {
          inFlight.current = null
        }
      })()
      return inFlight.current
    },
    [depsRef, describe],
  )

  const run = useCallback(() => runSync('syncing', syncNow), [runSync])
  const restore = useCallback(() => runSync('restoring', syncNow), [runSync])
  const resolve = useCallback(
    (decisions: readonly SyncReviewDecision[]) =>
      runSync('syncing', (current) => applyPendingDeletions(current, decisions)),
    [runSync],
  )

  // Asks the question without starting a Sync. A `clean` answer changes nothing on screen: there
  // was no Sync, so there is no success state to show.
  const openReview = useCallback(async (): Promise<SyncOutcome> => {
    const current = depsRef.current
    if (!current) return { kind: 'offline' }
    const outcome = await findReviewItems(current)
    if (outcome.kind === 'needs-review') {
      dispatch({ type: 'reviewOpened', items: outcome.items })
      describe(outcome.items)
    }
    return outcome
  }, [depsRef, describe])

  const dismiss = useCallback(() => dispatch({ type: 'dismissed' }), [])

  const review = state.review
  const reloadReview = useCallback(() => {
    if (!review) return
    dispatch({ type: 'reviewOpened', items: review.items })
    describe(review.items)
  }, [review, describe])

  const runner = useMemo<SyncRunner | null>(
    () => (deps ? { ...state, run, restore, openReview, resolve, dismiss, reloadReview } : null),
    [deps, state, run, restore, openReview, resolve, dismiss, reloadReview],
  )

  useEffect(() => {
    if (state.phase !== 'synced') return
    const id = setTimeout(() => dispatch({ type: 'acknowledged' }), SYNCED_MS)
    return () => clearTimeout(id)
  }, [state.phase])

  useEffect(() => {
    // Ask the browser not to evict the RxDB store; it is the source of truth, not a cache.
    void navigator.storage?.persist?.()
  }, [])

  const autosync = useCallback(() => void run(), [run])
  useAutosync(Boolean(deps), autosync)

  return (
    <SyncRunnerContext value={runner}>
      {children}
      <UnsyncedResetDialog reset={unsyncedReset} />
    </SyncRunnerContext>
  )
}
