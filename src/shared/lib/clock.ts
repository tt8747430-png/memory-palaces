/** One day in milliseconds. */
export const DAY_MS = 86_400_000

export interface Clock {
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }

/**
 * The one way an instant becomes a stored timestamp. Every `createdAt` and
 * `updatedAt` in the app goes through here, so the format cannot drift between
 * commands and a test can pin the clock by passing `now`.
 */
export function nowIso(now: number = Date.now()): string {
  return new Date(now).toISOString()
}

export function fixedClock(ms: number): Clock {
  return { now: () => ms }
}
