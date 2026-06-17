import { createContext, useContext } from 'react'
import type { AuthGateway } from '@/shared/api'

/** React injection point for the composition-root {@link AuthGateway} adapter. */
export const AuthGatewayContext = createContext<AuthGateway | null>(null)

/** Imperative handle to the auth gateway. Throws if no provider is mounted. */
export function useAuthGateway(): AuthGateway {
  const gateway = useContext(AuthGatewayContext)
  if (!gateway) {
    throw new Error('Auth gateway missing — render inside <AuthGatewayContext value={…}>')
  }
  return gateway
}
