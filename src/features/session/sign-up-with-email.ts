import type { AuthGateway } from '@/shared/api'
import { makeAccountSession, type SessionStore } from '@/entities/session'

export interface SignUpWithEmailInput {
  name: string
  email: string
}

export interface SessionCommandDeps {
  gateway: AuthGateway
  sessionStore: SessionStore
}

/**
 * Command — create a (mock) account and make it the current session. The gateway
 * persists the identity; no password is stored or checked. Capturing name/email into
 * the profile is a separate concern composed in {@link useAuthActions}. `now` is
 * injected for deterministic tests. Phase 9 swaps the gateway adapter, not this.
 */
export async function signUpWithEmail(
  deps: SessionCommandDeps,
  input: SignUpWithEmailInput,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.signUp({ email: input.email, name: input.name })
  await deps.sessionStore
    .getState()
    .set(
      makeAccountSession(auth.id, { email: input.email, name: input.name }, new Date(now).toISOString()),
    )
}
