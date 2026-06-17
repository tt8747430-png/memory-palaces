const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Lightweight email shape check (not delivery validation). Trims first. */
export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}
