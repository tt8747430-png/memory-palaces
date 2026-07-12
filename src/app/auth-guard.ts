import type { AuthKind } from '@/shared/api'
import { ROUTES } from '@/shared/config/routes'

const AUTH_PATHS: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot, ROUTES.welcome]

const SIGNED_OUT_ONLY: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgot]

export function authRedirect(pathname: string, kind: AuthKind | null): string | null {
  if (kind === null && !AUTH_PATHS.includes(pathname)) return ROUTES.login
  if (kind === 'account' && SIGNED_OUT_ONLY.includes(pathname)) return ROUTES.home
  return null
}
