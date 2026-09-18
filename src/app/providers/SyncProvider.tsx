import { type ReactNode, useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { CloudSyncPort, PersistedAuth, RemoteChangeEvent, StoragePort } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import type { SyncedTable } from '@/shared/config/sync-tables'
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
import { usePreferencesStore } from '@/entities/preferences'
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
  syncManager: Pick<SyncManager, 'start' | 'stop'> | null
  cloudSync: CloudSyncPort | null
  auth: PersistedAuth | null
  resetLocal: () => Promise<void>
  storage: StoragePort
  /** Core plus contributed, composed at startup. A cycle peeks exactly these. */
  syncTables: readonly SyncedTable[]
  dataOwner?: DataOwner
  children?: ReactNode
}

const SYNCED_MS = 2500

export function SyncProvider({
  syncManager,
  cloudSync,
  auth,
  resetLocal,
  storage,
  syncTables,
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
  // Which tables replicate follows the enabled set. The stored array's identity only changes when
  // preferences do, so handing it to the transition effect cannot loop.
  const enabledExtensions = usePreferencesStore((state) => state.preferences?.extensions)

  const inFlight = useRef<Promise<SyncOutcome> | null>(null)

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
    enabledExtensions,
  })

  const deps = useMemo<SyncDeps | null>(
    () =>
      cloudSync && auth?.kind === 'account' && watchingFor === auth.id
        ? {
            cloud: cloudSync,
            tables: syncTables,
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
      syncTables,
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
