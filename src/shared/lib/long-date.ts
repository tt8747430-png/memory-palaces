export const longDate = (iso: string, locale: string): string =>
  new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

export const daysFrom = (from: number, days: number): string =>
  new Date(from + days * 24 * 60 * 60 * 1000).toISOString()
