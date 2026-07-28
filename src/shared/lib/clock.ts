/** One day in milliseconds. */
export const DAY_MS = 86_400_000

export interface Clock {
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }

export function fixedClock(ms: number): Clock {
  return { now: () => ms }
}
