import type { AuthGateway } from '@/shared/api'

/**
 * Command — request a password reset. Simulated (no backend): it resolves without
 * sending. Kept as a feature so the UI never calls the gateway directly and Phase 9
 * can wire real email delivery behind the same call.
 */
export async function requestPasswordReset(gateway: AuthGateway, email: string): Promise<void> {
  await gateway.requestPasswordReset(email)
}
