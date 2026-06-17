import type { SessionCommandDeps } from './sign-up-with-email'

/**
 * Command — log out. Clears the persisted identity and the current session. Local
 * palaces/progress are intentionally left untouched (wiping them is the separate
 * "Clear data" flow). The route guard then sends the user to the login screen.
 */
export async function signOut(deps: SessionCommandDeps): Promise<void> {
  await deps.gateway.signOut()
  await deps.sessionStore.getState().clear()
}
