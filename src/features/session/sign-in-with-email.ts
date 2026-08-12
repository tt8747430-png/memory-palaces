import { makeAccountSession } from '@/entities/session'
import type { SessionCommandDeps } from './sign-up-with-email'
import { nowIso } from '@/shared/lib'

export interface SignInWithEmailInput {
  email: string
  password: string
}

export async function signInWithEmail(
  deps: SessionCommandDeps,
  input: SignInWithEmailInput,
  now: number = Date.now(),
): Promise<void> {
  const auth = await deps.gateway.signIn({ email: input.email, password: input.password })
  await deps.sessionStore
    .getState()
    .set(
      makeAccountSession(
        auth.id,
        { email: auth.email ?? input.email, name: auth.name ?? '' },
        nowIso(now),
      ),
    )
}
