import { inject } from '@angular/core'
import { Router } from '@angular/router'
import type { CanActivateFn } from '@angular/router'
import { AUTH_GATEWAY } from './data/stores'
import { authRedirect } from './model/auth-redirect'

/** Redirects signed-out visitors to login and signed-in accounts away from auth pages. */
export const authGuard: CanActivateFn = (_route, state) => {
  const gateway = inject(AUTH_GATEWAY)
  const router = inject(Router)
  const pathname = state.url.split('?')[0] ?? state.url
  const target = authRedirect(pathname, gateway.getPersisted()?.kind ?? null)
  return target && target !== pathname ? router.parseUrl(target) : true
}
