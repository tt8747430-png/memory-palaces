import type { SessionCommandDeps } from './sign-up-with-email'

export async function signOut(deps: SessionCommandDeps): Promise<void> {
  try {
    await deps.gateway.signOut()
  } finally {
    await deps.sessionStore.getState().clear()
  }
}
