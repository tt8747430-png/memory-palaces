import type { AuthGateway } from '../data/auth-gateway'

export async function requestPasswordReset(gateway: AuthGateway, email: string): Promise<void> {
  await gateway.requestPasswordReset(email)
}
