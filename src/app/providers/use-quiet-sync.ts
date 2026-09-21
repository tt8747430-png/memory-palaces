import { useEffect, useEffectEvent, useMemo } from 'react'
import type { SyncOutcome } from '@/shared/lib'
import type { SyncedTable } from '@/shared/config/sync-tables'
import { selectLatestPendingAtIn, usePendingChangeStore } from '@/entities/pending-change'
import { CLOUD_DEBOUNCE_MS, useQuietFire, WRITE_DEBOUNCE_MS } from './use-quiet-fire'

export interface QuietSyncDeps {
  /** A runner exists for this account: a cycle can run at all. */
  active: boolean
  /** The tables whose changes go on their own. Empty means there is nothing for this to do. */
  quiet: readonly SyncedTable[]
  run: () => Promise<SyncOutcome>
  /** Bumped when a quiet table is heard to move elsewhere, or the watcher came back after a drop. */
  moved: number
}

/**
 * What wakes the Quiet sync. Preferences and the profile are not the learner's work: they go up as
 * soon as they change, on every device, and **Autosync has no say** — that preference governs the
 * held tables.
 *
 * Debounced after the last quiet write, so ten taps on a toggle are one push; woken again on coming
 * back online, on leaving or returning to the app, and when a quiet table moves elsewhere. There is
 * no retry ladder: a setting is cheap, and the next change or page event carries it.
 */
export function useQuietSync({ active, quiet, run, moved }: QuietSyncDeps): void {
  const on = active && quiet.length > 0
  // Only a quiet write wakes this: a graded card must not push the theme and call it news.
  const latestWriteAt = usePendingChangeStore(
    useMemo(() => selectLatestPendingAtIn(quiet), [quiet]),
  )

  const sync = () => {
    void run()
  }

  const onPageEvent = useEffectEvent(sync)
  useEffect(() => {
    if (!on) return
    const trigger = () => onPageEvent()
    window.addEventListener('online', trigger)
    document.addEventListener('visibilitychange', trigger)
    window.addEventListener('pagehide', trigger)
    return () => {
      window.removeEventListener('online', trigger)
      document.removeEventListener('visibilitychange', trigger)
      window.removeEventListener('pagehide', trigger)
    }
  }, [on])

  useQuietFire(on && latestWriteAt !== null, latestWriteAt, WRITE_DEBOUNCE_MS, sync)
  useQuietFire(on && moved > 0, moved, CLOUD_DEBOUNCE_MS, sync)
}
