import { useEffect } from 'react'
import { selectLatestPendingAt, usePendingChangeStore } from '@/entities/pending-change'
import { selectAutosync, useSyncStateStore } from '@/entities/sync-state'

/** How long after the last write Autosync waits before running, so a burst of edits is one Sync. */
const AUTOSYNC_DEBOUNCE_MS = 4000

/**
 * Autosync, and only Autosync: a Sync on reconnect, on returning to the app, on leaving it, and once
 * a burst of writes settles. With it off there is deliberately nothing here — no reconnect pass and
 * no flush on the way out — because that is what "manual" means, and the banner is what stands in
 * the gap.
 *
 * Every trigger goes through `sync`, which is `syncNow`. A cycle run directly would push a deletion
 * without first asking whether the cloud moved under it, and would never confirm the pending log.
 */
export function useAutosync(active: boolean, sync: () => void): void {
  const autosync = useSyncStateStore(selectAutosync) && active
  // The newest write, not the count: editing one card ten times is one entry and ten writes, and
  // the wait has to start over from the tenth.
  const latestWriteAt = usePendingChangeStore(selectLatestPendingAt)

  useEffect(() => {
    if (!autosync) return
    const onVisibility = () => sync()
    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', sync)
    return () => {
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', sync)
    }
  }, [autosync, sync])

  useEffect(() => {
    if (!autosync || !latestWriteAt) return
    const id = setTimeout(sync, AUTOSYNC_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [autosync, latestWriteAt, sync])
}
