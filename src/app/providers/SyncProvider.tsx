import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { CloudSyncPort, PersistedAuth, RemoteChangeHandlers, StoragePort } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import { activeSyncTables, type SyncTableSpec } from '@/shared/config/sync-tables'
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
import { isExtensionEnabled, usePreferencesStore } from '@/entities/preferences'
import { useSyncStateStoreApi } from '@/entities/sync-state'
import {
  applyPendingDeletions,
  describeReviewItems,
  findReviewItems,
  noteCloudChange,
  repairSync,
  type SyncDeps,
  syncNow,
} from '@/features/sync'
import { INITIAL_RUNNER_STATE, runnerReducer } from './sync-runner-state'
import { useAutosync } from './use-autosync'
import { useFirstSync } from './use-first-sync'
import { useDataTransition } from './use-data-transition'
import { UnsyncedResetDialog } from './UnsyncedResetDialog'

export interface SyncProviderProps {
  syncManager: Pick<SyncManager, 'start' | 'stop'> | null
  cloudSync: CloudSyncPort | null
  /** `undefined` while the session is still being restored — not known, which is not signed out. */
  auth: PersistedAuth | null | undefined
  resetLocal: () => Promise<void>
  storage: StoragePort
  /**
   * Every table that could replicate, core plus contributed, composed at startup. Which of them a
   * cycle actually covers is derived here from the enabled extensions.
   */
  syncTables: readonly SyncTableSpec[]
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
  // preferences do, so handing the derived list to the transition effect cannot loop. The peek and
  // the watcher read the same list — a table only one of them knows about is the bug this prevents.
  const enabledExtensions = usePreferencesStore((state) => state.preferences?.extensions)
  const tables = useMemo(
    () =>
      activeSyncTables(syncTables, (id) =>
        isExtensionEnabled({ extensions: enabledExtensions ?? [] }, id),
      ),
    [syncTables, enabledExtensions],
  )

  const inFlight = useRef<Promise<SyncOutcome> | null>(null)
  // The watcher came back after a drop: whatever moved meanwhile went unheard, so Autosync pulls.
  const [reconnects, setReconnects] = useState(0)

  const watcher = useMemo<RemoteChangeHandlers>(
    () => ({
      // An event during a cycle is the cycle's own echo or a change the cycle's second peek will
      // see; either way the cycle's outcome says whether the cloud is ahead.
      onChange: (event) => {
        if (!inFlight.current) void noteCloudChange({ syncStateStore }, event)
      },
      onReconnect: () => setReconnects((count) => count + 1),
    }),
    [syncStateStore],
  )

  const { watchingFor, status, unsyncedReset } = useDataTransition({
    syncManager,
    auth,
    resetLocal,
    storage,
    dataOwner,
    watcher,
    tables,
  })

  // The account this device can sync as — one derivation, read by every part below.
  const account =
    auth === undefined
      ? undefined
      : cloudSync && syncManager && auth?.kind === 'account'
        ? auth.id
        : null

  const deps = useMemo<SyncDeps | null>(
    () =>
      cloudSync && account && watchingFor === account
        ? {
            cloud: cloudSync,
            tables,
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
      tables,
      account,
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
  const repair = useCallback(() => runSync('syncing', repairSync), [runSync])
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
    () =>
      deps
        ? { ...state, tables, run, restore, repair, openReview, resolve, dismiss, reloadReview }
        : null,
    [deps, state, tables, run, restore, repair, openReview, resolve, dismiss, reloadReview],
  )

  useEffect(() => {
    if (state.phase !== 'synced') return
    const id = setTimeout(() => dispatch({ type: 'acknowledged' }), SYNCED_MS)
    return () => clearTimeout(id)
  }, [state.phase])

  useEffect(() => {
    void navigator.storage?.persist?.()
  }, [])

  useAutosync({ active: deps !== null, run, reconnects })
  useFirstSync({ account, canSync: deps !== null, transition: status, tables, run })

  return (
    <SyncRunnerContext value={runner}>
      {children}
      <UnsyncedResetDialog reset={unsyncedReset} />
    </SyncRunnerContext>
  )
}
