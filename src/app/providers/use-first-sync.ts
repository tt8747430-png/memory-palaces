import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { selectIsReady, type SyncOutcome, useLatest, useSplashStore } from '@/shared/lib'
import { selectLastSyncedAt, useSyncStateStore } from '@/entities/sync-state'
import { selectAutosync, usePreferencesStore } from '@/entities/preferences'
import type { TransitionStatus } from './use-data-transition'

/**
 * How long the splash waits on a first Sync before letting the learner in — the cycle carries on
 * under the banner. The second of the two waits ADR 0004 allows; beyond it the app does not hold
 * a learner out on the network.
 */
export const FIRST_SYNC_BUDGET_MS = 10_000

export interface FirstSyncDeps {
  /**
   * Who is signed in: an account that could sync, `null` for no one who could (a guest, no one, no
   * cloud), `undefined` while the session is still being restored.
   */
  account: string | null | undefined
  /** The watcher is up for that account, so a cycle can run. */
  canSync: boolean
  transition: TransitionStatus
  /** The tables live right now — preferences pulled by the first cycle can widen them. */
  tables: readonly SyncedTable[]
  run: () => Promise<SyncOutcome>
}

interface FirstSync {
  account: string
  /** The tables the last cycle covered, once one has landed; null before. */
  covered: readonly SyncedTable[] | null
  over: boolean
}

const sameTables = (a: readonly SyncedTable[], b: readonly SyncedTable[]): boolean =>
  a.length === b.length && a.every((table) => b.includes(table))

const landed = (outcome: SyncOutcome): boolean =>
  outcome.kind === 'clean' || outcome.kind === 'merged'

/**
 * An account's first Sync on this device — a fresh device, one just cleared of another account,
 * guest data about to join an account, a relaunch after a first Sync that did not finish. Nothing
 * else pulls until Autosync fires on some later event, so this runs the cycle itself as soon as it
 * can and holds the splash over it: the learner lands on their decks, not an empty Library.
 *
 * - It releases the splash's `session` hold once it knows whether a first Sync is due, raising
 *   `first-sync` before — never after — so a cold launch cannot drop the splash and bring it back.
 * - It covers every table: when the preferences the first cycle pulled switch an extension on, a
 *   second cycle brings that extension's rows in too.
 * - Every outcome ends it — landed, offline, failed, a question to answer — and so does
 *   `FIRST_SYNC_BUDGET_MS`. A cycle that did not finish is not retried under the splash: the banner
 *   says what happened, and Autosync pulls once it can (ADR 0004).
 * - With Autosync off it does nothing: nothing leaves the device until the learner asks.
 */
export function useFirstSync({ account, canSync, transition, tables, run }: FirstSyncDeps): void {
  const syncStateReady = useSyncStateStore(selectIsReady)
  const lastSyncedAt = useSyncStateStore(selectLastSyncedAt)
  const preferencesReady = usePreferencesStore(selectIsReady)
  const autosync = usePreferencesStore(selectAutosync)
  const hold = useSplashStore((state) => state.hold)
  const release = useSplashStore((state) => state.release)
  const [firstSync, setFirstSync] = useState<FirstSync | null>(null)
  const running = useRef(false)
  const liveTables = useLatest(tables)

  const decided =
    account !== undefined &&
    (account === null || (syncStateReady && preferencesReady && transition !== 'deciding'))
  const ours = account && firstSync?.account === account ? firstSync : null
  const due =
    decided &&
    Boolean(account) &&
    transition === 'settled' &&
    autosync &&
    (ours ? !ours.over : lastSyncedAt === null)

  // Before paint, so a learner signing in never sees one frame of an empty Library.
  useLayoutEffect(() => {
    if (!decided) return
    if (!due) {
      release('session')
      return
    }
    hold('first-sync')
    release('session')
    return () => release('first-sync')
  }, [decided, due, hold, release])

  useEffect(() => {
    if (!due || !account) return
    const id = setTimeout(
      () =>
        setFirstSync((held) => ({
          account,
          covered: held?.account === account ? held.covered : null,
          over: true,
        })),
      FIRST_SYNC_BUDGET_MS,
    )
    return () => clearTimeout(id)
  }, [due, account])

  useEffect(() => {
    if (!due || !account || !canSync || running.current) return
    if (ours?.covered && sameTables(ours.covered, tables)) return
    running.current = true
    const covering = tables
    const settle = (widened: boolean) => {
      running.current = false
      setFirstSync({ account, covered: covering, over: !widened })
    }
    void run().then(
      (outcome) => settle(landed(outcome) && !sameTables(covering, liveTables.current)),
      () => settle(false),
    )
  }, [due, account, canSync, ours, tables, run, liveTables])
}
