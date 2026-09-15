import { isAuthError } from '@/shared/api'

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
  offline_only: 'auth.errors.offlineOnly',
  network: 'auth.errors.network',
  current_password_invalid: 'auth.errors.currentPasswordInvalid',
  signup_failed: 'auth.errors.signUpFailed',
  signin_failed: 'auth.errors.signInFailed',
} as const satisfies Record<string, string>

export type AuthErrorCopyKey = (typeof COPY)[keyof typeof COPY]

export function authErrorKey(error: unknown): AuthErrorCopyKey | null {
  if (!isAuthError(error)) return null
  return (COPY as Record<string, AuthErrorCopyKey>)[error.code] ?? null
}

export function authErrorMessage(
  error: unknown,
  translate: (key: AuthErrorCopyKey) => string,
  fallback: string,
): string {
  const key = authErrorKey(error)
  if (key) return translate(key)
  return error instanceof Error && error.message ? error.message : fallback
}
