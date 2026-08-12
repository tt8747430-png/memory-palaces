import { type ReactNode, useEffect, useRef } from 'react'
import type { PersistedAuth } from '@/shared/api'
import type { SyncManager } from '@/shared/api/supabase'
import { resolveDataTransition } from '@/shared/lib'
import { claimGuestData } from '@/features/auth'

export type SyncController = Pick<SyncManager, 'start' | 'flush' | 'stop'>

export interface SyncProviderProps {
  /** Null when no Supabase project is configured — the app then runs purely on-device. */
  syncManager: SyncController | null
  /** The current identity. A guest syncs nothing; their data is claimed when they sign up. */
  auth: PersistedAuth | null
  /** Wipes the on-device database when a different account signs in. */
  resetLocal: () => Promise<void>
  children?: ReactNode
}

/**
 * Runs the replication for as long as an account is signed in, decides what happens to the local
 * data when the identity changes, and gets the last writes out when the app is backgrounded or
 * closed — the moment on mobile where a tab is most likely to be killed before RxDB's own retry
 * loop would have pushed.
 */
export function SyncProvider({ syncManager, auth, resetLocal, children }: SyncProviderProps) {
  const previousAuth = useRef<PersistedAuth | null>(null)

  useEffect(() => {
    // Ask the browser not to evict the RxDB store; it is the source of truth, not a cache.
    void navigator.storage?.persist?.()
  }, [])

  useEffect(() => {
    const transition = resolveDataTransition(previousAuth.current, auth)
    previousAuth.current = auth
    if (!syncManager || auth?.kind !== 'account') return

    void claimGuestData({ transition, userId: auth.id, syncManager, resetLocal })

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
  }, [syncManager, auth, resetLocal])

  return children
}
