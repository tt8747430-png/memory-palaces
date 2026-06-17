import { type ReactNode, useEffect, useRef } from 'react'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { restoreSession } from '@/features/session'

/**
 * Boot the session. The store is in-memory, so on mount we rehydrate it from the
 * gateway (the persisted source of truth). If nothing is persisted the session stays
 * null and the route guard sends the user to login / "Continue as guest". The ref
 * guard keeps StrictMode's double-invoke from racing two restores.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const gateway = useAuthGateway()
  const sessionStore = useSessionStoreApi()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void restoreSession({ gateway, sessionStore })
  }, [gateway, sessionStore])

  return children
}
