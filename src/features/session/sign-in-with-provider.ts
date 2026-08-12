import type { AuthGateway, AuthProvider } from '@/shared/api'

/**
 * Starts the provider redirect. Nothing is written to the session store here — the browser leaves
 * the app and returns to `/auth/callback`, where `onAuthChange` delivers the session.
 */
export async function signInWithProvider(
  gateway: AuthGateway,
  provider: AuthProvider,
): Promise<void> {
  await gateway.signInWithProvider(provider)
}
