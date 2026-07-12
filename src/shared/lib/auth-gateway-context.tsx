import { createContext, useContext } from 'react'
import type { AuthGateway } from '@/shared/api'

export const AuthGatewayContext = createContext<AuthGateway | null>(null)

export function useAuthGateway(): AuthGateway {
  const gateway = useContext(AuthGatewayContext)
  if (!gateway) {
    throw new Error('Auth gateway missing — render inside <AuthGatewayContext value={…}>')
  }
  return gateway
}
