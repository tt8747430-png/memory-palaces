import type { AuthGateway } from '../data/auth-gateway'
import { makeAccountSession } from '../model/session'
import type { SessionStore } from '../data/stores'

export interface SignUpWithEmailInput {
  name: string
  email: string
}

export interface SessionCommandDeps {
  gateway: AuthGateway
  sessionStore: SessionStore
}

export async function signUpWithEmail(
  deps: SessionCommandDeps,
  input: SignUpWithEmailInput,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.signUp({ email: input.email, name: input.name })
  await deps.sessionStore
    
    .set(
      makeAccountSession(
        auth.id,
        { email: input.email, name: input.name },
        new Date(now).toISOString(),
      ),
    )
}
