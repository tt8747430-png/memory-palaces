/**
 * Time as an injectable dependency. The domain never reads the wall clock
 * directly; features pass a `Clock`, and the pure algorithms take the resulting
 * `now: number` — so every behavior is deterministic under test.
 */
export interface Clock {
  /** Current instant in epoch milliseconds. */
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }

/** A clock frozen at a single instant — for deterministic tests/seeding. */
export function fixedClock(ms: number): Clock {
  return { now: () => ms }
}
