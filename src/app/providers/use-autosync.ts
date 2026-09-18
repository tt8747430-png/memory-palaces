import { useEffect, useEffectEvent, useState } from 'react'
import type { SyncOutcome } from '@/shared/lib'
import { selectLatestPendingAt, usePendingChangeStore } from '@/entities/pending-change'
import { selectAutosync, usePreferencesStore } from '@/entities/preferences'
import { selectCloudChanged, useSyncStateStore } from '@/entities/sync-state'

/** After the last local write: ten edits to one card are one Sync. */
export const AUTOSYNC_DEBOUNCE_MS = 4000
/** After the cloud is heard to move: a burst of another device's writes is one pull. */
export const CLOUD_CHANGE_DEBOUNCE_MS = 3000
/** After a cycle fails, before the next try; the last delay repeats. */
export const RETRY_DELAYS_MS: readonly number[] = [15_000, 60_000, 300_000]

export interface AutosyncDeps {
  /** A runner exists for this account: a Sync can run at all. */
  active: boolean
  run: () => Promise<SyncOutcome>
  /** How many times the cloud watcher has come back after a drop. */
  reconnects: number
}

const canRetry = () => navigator.onLine && document.visibilityState === 'visible'

/** The wait before the next try, `failures` failed runs in: the ladder's step, its last repeating. */
const retryDelay = (failures: number): number =>
  RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length) - 1] ?? 0

/**
 * Runs `fire` once `delay` after `key` last changed while `armed` — a newer change restarts the
 * wait, and disarming cancels it. `fire` is read when the wait ends, never as a dependency.
 */
function useQuietFire(armed: boolean, key: unknown, delay: number, fire: () => void): void {
  const onQuiet = useEffectEvent(fire)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => onQuiet(), delay)
    return () => clearTimeout(id)
  }, [armed, key, delay])
}

/**
 * Autosync: with the preference on, a Sync runs without being asked — on coming back online, on
 * returning to or leaving the app, after the last of a burst of local writes, and when the cloud
 * moves (heard on the Realtime channel, or seen landing during a cycle) or may have (the channel
 * came back after a drop). A cycle that fails is tried again on a ladder while the app is online
 * and in front; any success resets it. Nothing here runs with Autosync off.
 */
export function useAutosync({ active, run, reconnects }: AutosyncDeps): void {
  const autosync = usePreferencesStore(selectAutosync) && active
  const latestWriteAt = usePendingChangeStore(selectLatestPendingAt)
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

  const onPageEvent = useEffectEvent(sync)
  useEffect(() => {
    if (!autosync) return
    const trigger = () => onPageEvent()
    window.addEventListener('online', trigger)
    document.addEventListener('visibilitychange', trigger)
    window.addEventListener('pagehide', trigger)
    return () => {
      window.removeEventListener('online', trigger)
      document.removeEventListener('visibilitychange', trigger)
      window.removeEventListener('pagehide', trigger)
    }
  }, [autosync])

  useQuietFire(autosync && latestWriteAt !== null, latestWriteAt, AUTOSYNC_DEBOUNCE_MS, sync)
  useQuietFire(autosync && cloudChanged, cloudChanged, CLOUD_CHANGE_DEBOUNCE_MS, sync)
  useQuietFire(autosync && reconnects > 0, reconnects, CLOUD_CHANGE_DEBOUNCE_MS, sync)
  useQuietFire(autosync && failures > 0, failures, retryDelay(failures), () => {
    if (canRetry()) sync()
  })
}
