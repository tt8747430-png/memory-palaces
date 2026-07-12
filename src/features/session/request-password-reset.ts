import type { AuthGateway } from '@/shared/api'

export async function requestPasswordReset(gateway: AuthGateway, email: string): Promise<void> {
  await gateway.requestPasswordReset(email)
}
