import type { AuthKind } from '@/shared/api'
import { ROUTES } from '@/shared/config/routes'

/** Routes reachable without an account. */
const AUTH_PATHS: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot, ROUTES.welcome]

/** Auth routes an account holder is bounced away from (welcome is the exception —
 * it's shown right after sign-up). Guests are NOT bounced: they reach these to
 * upgrade from "Continue as guest" into a real account. */
const SIGNED_OUT_ONLY: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot]

/**
 * Pure session guard. `kind` is the persisted session kind (or null when there is no
 * session at all). No session is sent to login; an account is kept out of the
 * signed-out-only screens; a guest may go anywhere, including the auth screens.
 */
export function authRedirect(pathname: string, kind: AuthKind | null): string | null {
  if (kind === null && !AUTH_PATHS.includes(pathname)) return ROUTES.login
  if (kind === 'account' && SIGNED_OUT_ONLY.includes(pathname)) return ROUTES.home
  return null
}
