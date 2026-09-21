import { useMemo, useState } from 'react'
import type { SyncOutcome } from '@/shared/lib'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { selectLatestPendingAtIn, usePendingChangeStore } from '@/entities/pending-change'
import { selectAutosync, usePreferencesStore } from '@/entities/preferences'
import { selectCloudChanged, useSyncStateStore } from '@/entities/sync-state'
import {
  CLOUD_DEBOUNCE_MS,
  usePageEventFire,
  useQuietFire,
  WRITE_DEBOUNCE_MS,
} from './use-quiet-fire'

/** After a cycle fails, before the next try; the last delay repeats. */
export const RETRY_DELAYS_MS: readonly number[] = [15_000, 60_000, 300_000]

export interface AutosyncDeps {
  /** A runner exists for this account: a Sync can run at all. */
  active: boolean
  /** The held tables — the only writes Autosync answers. */
  held: readonly SyncedTable[]
  run: () => Promise<SyncOutcome>
  /** How many times the cloud watcher has come back after a drop. */
  reconnects: number
}

const canRetry = () => navigator.onLine && document.visibilityState === 'visible'

/** The wait before the next try, `failures` failed runs in: the ladder's step, its last repeating. */
const retryDelay = (failures: number): number =>
  RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1] ?? 0

/**
 * Autosync: with the preference on, a Sync runs without being asked — on coming back online, on
 * returning to or leaving the app, after the last of a burst of local writes, and when the cloud
 * moves (heard on the Realtime channel, or seen landing during a cycle) or may have (the channel
 * came back after a drop). A cycle that fails is tried again on a ladder while the app is online
 * and in front; any success resets it. Nothing here runs with Autosync off.
 *
 * It answers the **held** tables only. A quiet write has its own cycle, which the preference does
 * not govern — see `useQuietSync`.
 */
export function useAutosync({ active, held, run, reconnects }: AutosyncDeps): void {
  const autosync = usePreferencesStore(selectAutosync) && active
  const latestWriteAt = usePendingChangeStore(useMemo(() => selectLatestPendingAtIn(held), [held]))
  const cloudChanged = useSyncStateStore(selectCloudChanged)
  /** Failed runs since the last one that landed — the retry ladder's rung. */
  const [failures, setFailures] = useState(0)

  // Every automatic run reports back, so the retry ladder follows what actually happened.
  const sync = () => {
    void run().then((outcome) => {
      if (outcome.kind === 'failed') setFailures((count) => count + 1)
      else if (outcome.kind !== 'offline') setFailures(0)
    })
  }

  usePageEventFire(autosync, sync)

  useQuietFire(autosync && latestWriteAt !== null, latestWriteAt, WRITE_DEBOUNCE_MS, sync)
  useQuietFire(autosync && cloudChanged, cloudChanged, CLOUD_DEBOUNCE_MS, sync)
  useQuietFire(autosync && reconnects > 0, reconnects, CLOUD_DEBOUNCE_MS, sync)
  useQuietFire(autosync && failures > 0, failures, retryDelay(failures), () => {
    if (canRetry()) sync()
  })
}
