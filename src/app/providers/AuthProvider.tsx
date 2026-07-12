import { type ReactNode, useEffect, useRef } from 'react'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { restoreSession } from '@/features/session'

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
