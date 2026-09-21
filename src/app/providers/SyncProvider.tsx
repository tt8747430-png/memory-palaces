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
import { syncScope, type SyncedTable, type SyncTableSpec } from '@/shared/config/sync-tables'
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
  useAuthGateway,
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
  quietSync,
  repairSync,
  type SyncDeps,
  syncNow,
} from '@/features/sync'
import { INITIAL_RUNNER_STATE, runnerReducer } from './sync-runner-state'
import { useAutosync } from './use-autosync'
import { useQuietSync } from './use-quiet-sync'
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
  const gateway = useAuthGateway()
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
  const isEnabled = useCallback(
    (id: string) => isExtensionEnabled({ extensions: enabledExtensions ?? [] }, id),
    [enabledExtensions],
  )
  const { tables, held, quiet } = useMemo(
    () => syncScope(syncTables, isEnabled),
    [syncTables, isEnabled],
  )
  const labelKeys = useMemo(
    () =>
      Object.fromEntries(
        syncTables.flatMap((spec) => (spec.labelKey ? [[spec.table, spec.labelKey]] : [])),
      ) as Partial<Record<SyncedTable, string>>,
    [syncTables],
  )

  const inFlight = useRef<Promise<SyncOutcome> | null>(null)
  const quietInFlight = useRef<Promise<SyncOutcome> | null>(null)
  // The watcher came back after a drop: whatever moved meanwhile went unheard, so both cadences pull.
  const [reconnects, setReconnects] = useState(0)
  // A quiet table moved elsewhere. Counted rather than flagged: it needs no answer from the learner
  // and no banner, only the next Quiet sync.
  const [quietMoved, setQuietMoved] = useState(0)
  // Read through a ref so the handlers keep one identity — a new object here restarts the watcher.
  const quietRef = useLatest(quiet)

  const watcher = useMemo<RemoteChangeHandlers>(
    () => ({
      // An event during a cycle is the cycle's own echo or a change the cycle's second peek will
      // see; either way the cycle's outcome says whether the cloud is ahead.
      onChange: (event) => {
        if (quietRef.current.includes(event.table)) {
          // The same rule as the held path: during a quiet cycle the event is the cycle's own echo,
          // and counting it would send one more empty cycle after every settings push.
          if (!quietInFlight.current) setQuietMoved((count) => count + 1)
          return
        }
        if (!inFlight.current) void noteCloudChange({ syncStateStore }, event)
      },
      onReconnect: () => {
        setReconnects((count) => count + 1)
        setQuietMoved((count) => count + 1)
      },
    }),
    [syncStateStore, quietRef],
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
            held,
            quiet,
            pendingChangeStore,
            syncStateStore,
            deckStore,
            folderStore,
            cardStore,
            questionStore,
            now: nowIso,
            isOnline: readOnline,
            refreshAuth: () => gateway.refreshSession(),
          }
        : null,
    [
      cloudSync,
      gateway,
      tables,
      held,
      quiet,
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
  /**
   * A Sync over every live table, both cadences. Two moments ask for it: an account's first Sync on
   * this device, which must bring the settings in with the decks, and the forced Sync after a
   * cancelled deletion, which must bring back everything the account had.
   */
  const everything = useCallback(
    (phase: 'syncing' | 'restoring') =>
      runSync(phase, (current) => syncNow(current, { tables: current.tables })),
    [runSync],
  )
  const restore = useCallback(() => everything('restoring'), [everything])
  const firstSync = useCallback(() => everything('syncing'), [everything])
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

  /**
   * The Quiet sync runs beside the banner, never through it: it has no phase to show, no failure to
   * report and no question to ask. Its own single-flight is all the serialising it needs on this
   * side — the manager will not run two cycles at once anyway.
   */
  const runQuiet = useCallback((): Promise<SyncOutcome> => {
    const current = depsRef.current
    if (!current) return Promise.resolve<SyncOutcome>({ kind: 'offline' })
    quietInFlight.current ??= quietSync(current).finally(() => {
      quietInFlight.current = null
    })
    return quietInFlight.current
  }, [depsRef])

  const runner = useMemo<SyncRunner | null>(
    () =>
      deps
        ? {
            ...state,
            tables,
            held,
            quiet,
            labelKeys,
            run,
            restore,
            repair,
            openReview,
            resolve,
            dismiss,
            reloadReview,
          }
        : null,
    [
      deps,
      state,
      tables,
      held,
      quiet,
      labelKeys,
      run,
      restore,
      repair,
      openReview,
      resolve,
      dismiss,
      reloadReview,
    ],
  )

  useEffect(() => {
    if (state.phase !== 'synced') return
    const id = setTimeout(() => dispatch({ type: 'acknowledged' }), SYNCED_MS)
    return () => clearTimeout(id)
  }, [state.phase])

  useEffect(() => {
    void navigator.storage?.persist?.()
  }, [])

  useAutosync({ active: deps !== null, held, run, reconnects })
  useQuietSync({ active: deps !== null, quiet, run: runQuiet, moved: quietMoved })
  useFirstSync({ account, canSync: deps !== null, transition: status, tables, run: firstSync })

  return (
    <SyncRunnerContext value={runner}>
      {children}
      <UnsyncedResetDialog reset={unsyncedReset} />
    </SyncRunnerContext>
  )
}
