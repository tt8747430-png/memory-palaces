/** A date written out for a person — "15 October 2026" — in their own locale's order. */
export const longDate = (iso: string, locale: string): string =>
  new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

/** `days` from `from`, as an ISO string. */
export const daysFrom = (from: number, days: number): string =>
  new Date(from + days * 24 * 60 * 60 * 1000).toISOString()
