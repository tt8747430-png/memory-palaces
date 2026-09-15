import type { SessionCommandDeps } from './sign-up-with-email'

/**
 * The session store is cleared in a `finally`, so no gateway outcome can leave the app signed in
 * locally. A revoke that could not reach the server is not a reason to keep a session the gateway
 * has already thrown away, and a genuine failure still reaches the caller.
 */
export async function signOut(deps: SessionCommandDeps): Promise<void> {
  try {
    await deps.gateway.signOut()
  } finally {
    await deps.sessionStore.getState().clear()
  }
}
