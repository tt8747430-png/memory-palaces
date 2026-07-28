const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The shortest password the app will accept. */
export const MIN_PASSWORD = 8

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isLongEnoughPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD
}

export type EmailErrorKey = 'auth.errors.emailRequired' | 'auth.errors.emailInvalid'
export type PasswordErrorKey = 'auth.errors.passwordRequired' | 'auth.errors.passwordShort'

/**
 * The i18n key naming what is wrong with a credential, or `undefined` when
 * nothing is. Every entrance judges an email and a password the same way.
 */
export function emailErrorKey(value: string): EmailErrorKey | undefined {
  if (!value.trim()) return 'auth.errors.emailRequired'
  if (!isEmail(value)) return 'auth.errors.emailInvalid'
  return undefined
}

/** `strong` also demands the length a new password must reach. */
export function passwordErrorKey(
  value: string,
  { strong = false } = {},
): PasswordErrorKey | undefined {
  if (!value) return 'auth.errors.passwordRequired'
  if (strong && !isLongEnoughPassword(value)) return 'auth.errors.passwordShort'
  return undefined
}
