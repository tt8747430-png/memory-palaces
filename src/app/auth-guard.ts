import { ROUTES } from '@/shared/config/routes'

/** Routes reachable without a session. */
const AUTH_PATHS: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot, ROUTES.welcome]

/** Auth routes an already-signed-in user should be bounced away from (welcome is the
 * one exception — it's shown right after sign-up, when the user is already authed). */
const SIGNED_OUT_ONLY: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot]

/**
 * Pure session guard: given the destination and whether a session is persisted,
 * returns the path to redirect to, or null to allow. Drives the router's beforeLoad.
 */
export function authRedirect(pathname: string, isAuthenticated: boolean): string | null {
  if (!isAuthenticated && !AUTH_PATHS.includes(pathname)) return ROUTES.login
  if (isAuthenticated && SIGNED_OUT_ONLY.includes(pathname)) return ROUTES.home
  return null
}
