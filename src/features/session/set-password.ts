import type { AuthGateway } from '@/shared/api'

/**
 * Sets a new password for whoever is signed in. This is also how a recovery link finishes: the link
 * opens a session, and the new password replaces the forgotten one — which is why no current
 * password is required here. The provider enforces its own rules on top.
 */
export async function setPassword(gateway: AuthGateway, password: string): Promise<void> {
  await gateway.updatePassword(password)
}
