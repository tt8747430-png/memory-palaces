const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const UNITS: readonly [limit: number, size: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [MINUTE, 1000, 'second'],
  [HOUR, MINUTE, 'minute'],
  [DAY, HOUR, 'hour'],
  [30 * DAY, DAY, 'day'],
]

export function relativeTime(iso: string, now: number): string {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return iso

  const elapsed = now - at
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [limit, size, unit] of UNITS) {
    if (Math.abs(elapsed) < limit) return format.format(-Math.round(elapsed / size), unit)
  }
  return new Date(at).toLocaleDateString()
}
