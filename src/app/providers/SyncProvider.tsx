import { type ReactNode, useEffect } from 'react'
import type { SyncManager } from '@/shared/api/supabase'

export type SyncController = Pick<SyncManager, 'start' | 'flush' | 'stop'>

export interface SyncProviderProps {
  /** Null when no Supabase project is configured — the app then runs purely on-device. */
  syncManager: SyncController | null
  /** The signed-in account, or null for a guest: guest data stays local until it is claimed. */
  userId: string | null
  children?: ReactNode
}

/**
 * Runs the replication for as long as an account is signed in, and gets the last writes out when
 * the app is backgrounded or closed — the moment on mobile where a tab is most likely to be killed
 * before RxDB's own retry loop would have pushed.
 */
export function SyncProvider({ syncManager, userId, children }: SyncProviderProps) {
  useEffect(() => {
    // Ask the browser not to evict the RxDB store; it is the source of truth, not a cache.
    void navigator.storage?.persist?.()
  }, [])

  useEffect(() => {
    if (!syncManager || !userId) return
    void syncManager.start(userId)

    const flushOnLeave = () => {
      if (document.visibilityState === 'hidden') void syncManager.flush()
    }
    const flushNow = () => void syncManager.flush()

    document.addEventListener('visibilitychange', flushOnLeave)
    window.addEventListener('pagehide', flushNow)
    return () => {
      document.removeEventListener('visibilitychange', flushOnLeave)
      window.removeEventListener('pagehide', flushNow)
      void syncManager.stop()
    }
  }, [syncManager, userId])

  return children
}
