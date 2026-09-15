import { useEffect } from 'react'
import { selectLatestPendingAt, usePendingChangeStore } from '@/entities/pending-change'
import { selectAutosync, useSyncStateStore } from '@/entities/sync-state'

const AUTOSYNC_DEBOUNCE_MS = 4000

export function useAutosync(active: boolean, sync: () => void): void {
  const autosync = useSyncStateStore(selectAutosync) && active
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
