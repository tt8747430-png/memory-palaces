import { type ReactNode, useEffect, useRef } from 'react'
import { useSessionStoreApi } from '@/entities/session'
import { createGuestSession } from '@/features/session'

/**
 * Guest-first auth: on mount, ensure a guest session exists (fully usable offline,
 * no sign-up). Real Supabase accounts + guest-data claim arrive in Phase 9. The ref
 * guard keeps StrictMode's double-invoke from creating two guests.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useSessionStoreApi()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void createGuestSession(store)
  }, [store])

  return children
}
