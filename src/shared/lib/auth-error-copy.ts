import { isAuthError } from '@/shared/api'

/** Provider error codes worth their own sentence. Everything else keeps the provider's message. */
const COPY = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  user_already_exists: 'auth.errors.userExists',
  email_exists: 'auth.errors.userExists',
  weak_password: 'auth.errors.weakPassword',
  over_email_send_rate_limit: 'auth.errors.emailRateLimit',
  over_request_rate_limit: 'auth.errors.requestRateLimit',
  email_address_invalid: 'auth.errors.emailInvalid',
  validation_failed: 'auth.errors.emailInvalid',
  signup_disabled: 'auth.errors.signupDisabled',
} as const satisfies Record<string, string>

export type AuthErrorCopyKey = (typeof COPY)[keyof typeof COPY]

/**
 * The i18n key for what just went wrong. Null when the failure carries no code we have copy for —
 * the caller then shows what the provider said, which beats a generic apology that hides the cause.
 */
export function authErrorKey(error: unknown): AuthErrorCopyKey | null {
  if (!isAuthError(error)) return null
  return (COPY as Record<string, AuthErrorCopyKey>)[error.code] ?? null
}

/** Known code → its copy; otherwise the provider's message; otherwise the caller's fallback. */
export function authErrorMessage(
  error: unknown,
  translate: (key: AuthErrorCopyKey) => string,
  fallback: string,
): string {
  const key = authErrorKey(error)
  if (key) return translate(key)
  return error instanceof Error && error.message ? error.message : fallback
}
