import type { AuthGateway } from '@/shared/api'
import { makeAccountSession, type SessionStore } from '@/entities/session'
import { nowIso } from '@/shared/lib'

export interface SignUpWithEmailInput {
  name: string
  email: string
  password: string
}

export interface SessionCommandDeps {
  gateway: AuthGateway
  sessionStore: SessionStore
}

/**
 * Returns whether the account is usable straight away. With email confirmation on, sign-up creates
 * the account but opens no session — so no session is written here either. Treating that as signed
 * in would show the app to someone who cannot sync a single row, because every request would fail
 * RLS with no token.
 */
export async function signUpWithEmail(
  deps: SessionCommandDeps,
  input: SignUpWithEmailInput,
  now: number = Date.now(),
): Promise<{ sessionActive: boolean }> {
  const { auth, sessionActive } = await deps.gateway.signUp({
    email: input.email,
    name: input.name,
    password: input.password,
  })
  if (!sessionActive) return { sessionActive }

  await deps.sessionStore
    .getState()
    .set(makeAccountSession(auth.id, { email: input.email, name: input.name }, nowIso(now)))
  return { sessionActive }
}
