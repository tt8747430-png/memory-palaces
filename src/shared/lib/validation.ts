const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MIN_PASSWORD = 8

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isLongEnoughPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD
}

export type EmailErrorKey = 'auth.errors.emailRequired' | 'auth.errors.emailInvalid'
export type PasswordErrorKey = 'auth.errors.passwordRequired' | 'auth.errors.passwordShort'

export function emailErrorKey(value: string): EmailErrorKey | undefined {
  if (!value.trim()) return 'auth.errors.emailRequired'
  if (!isEmail(value)) return 'auth.errors.emailInvalid'
  return undefined
}

export function passwordErrorKey(
  value: string,
  { strong = false } = {},
): PasswordErrorKey | undefined {
  if (!value) return 'auth.errors.passwordRequired'
  if (strong && !isLongEnoughPassword(value)) return 'auth.errors.passwordShort'
  return undefined
}
