import type { SessionCommandDeps } from './sign-up-with-email'

export async function signOut(deps: SessionCommandDeps): Promise<void> {
  await deps.gateway.signOut()
  await deps.sessionStore.getState().clear()
}
