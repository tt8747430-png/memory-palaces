import type { AuthKind } from '@/shared/api'
import { ROUTES } from '@/shared/config/routes'

// `/auth/callback` is public on purpose: the OAuth return lands there *before* a session exists,
// so guarding it would bounce every social sign-in to /login mid-flight.
const AUTH_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgot,
  ROUTES.welcome,
  ROUTES.authCallback,
]

const SIGNED_OUT_ONLY: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot]

export function authRedirect(pathname: string, kind: AuthKind | null): string | null {
  if (kind === null && !AUTH_PATHS.includes(pathname)) return ROUTES.login
  if (kind === 'account' && SIGNED_OUT_ONLY.includes(pathname)) return ROUTES.home
  return null
}
