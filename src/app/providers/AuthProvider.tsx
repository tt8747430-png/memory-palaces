import { type ReactNode, useEffect } from 'react'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { restoreSession } from '@/features/session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const gateway = useAuthGateway()
  const sessionStore = useSessionStoreApi()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let cancelled = false

    void restoreSession({ gateway, sessionStore }).then((stop) => {
      if (cancelled) stop()
      else unsubscribe = stop
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [gateway, sessionStore])

  return children
}
