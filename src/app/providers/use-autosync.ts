import { useEffect, useRef, useState } from 'react'
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
  const [failures, setFailures] = useState(0)
  const attempts = useRef(0)

  // Every automatic run reports back, so the retry ladder follows what actually happened.
  const sync = useRef(() => {})
  sync.current = () => {
    void run().then((outcome) => {
      if (outcome.kind === 'failed') {
        attempts.current += 1
        setFailures((count) => count + 1)
      } else if (outcome.kind !== 'offline') {
        attempts.current = 0
      }
    })
  }

  useEffect(() => {
    if (!autosync) return
    const trigger = () => sync.current()
    window.addEventListener('online', trigger)
    document.addEventListener('visibilitychange', trigger)
    window.addEventListener('pagehide', trigger)
    return () => {
      window.removeEventListener('online', trigger)
      document.removeEventListener('visibilitychange', trigger)
      window.removeEventListener('pagehide', trigger)
    }
  }, [autosync])

  useEffect(() => {
    if (!autosync || !latestWriteAt) return
    const id = setTimeout(() => sync.current(), AUTOSYNC_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [autosync, latestWriteAt])

  useEffect(() => {
    if (!autosync || !cloudChanged) return
    const id = setTimeout(() => sync.current(), CLOUD_CHANGE_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [autosync, cloudChanged])

  useEffect(() => {
    if (!autosync || reconnects === 0) return
    const id = setTimeout(() => sync.current(), CLOUD_CHANGE_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [autosync, reconnects])

  useEffect(() => {
    if (!autosync || failures === 0) return
    const delay = RETRY_DELAYS_MS[Math.min(attempts.current, RETRY_DELAYS_MS.length) - 1]
    if (delay === undefined) return
    const id = setTimeout(() => {
      if (canRetry()) sync.current()
    }, delay)
    return () => clearTimeout(id)
  }, [autosync, failures])
}
