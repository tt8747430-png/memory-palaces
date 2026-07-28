const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The shortest password the app will accept. */
export const MIN_PASSWORD = 8

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isLongEnoughPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD
}
