/**
 * Spaced-repetition scheduler (an SM-2 variant) for loci. A locus with no
 * `SrsState` is "new" and always due. Grading advances the schedule. Kept small:
 * four grades, one ease factor, day intervals. `now` is injected (epoch ms) so
 * scheduling is pure and deterministic.
 */
export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  /** ISO date the card is next due. */
  due: string
  /** Current interval in days. */
  interval: number
  /** Ease factor (>= MIN_EASE). */
  ease: number
  /** Consecutive successful reviews. */
  reps: number
  /** Times the card was forgotten. */
  lapses: number
  /** ISO timestamp of the last review. */
  lastReviewed: string
}

export type SrsStatus = 'new' | 'learning' | 'known'

const DAY_MS = 86_400_000
const MIN_EASE = 1.3
const DEFAULT_EASE = 2.5
/** Interval (days) at/above which a card counts as mastered. */
const MATURE_INTERVAL = 21

function isoInDays(now: number, days: number): string {
  return new Date(now + days * DAY_MS).toISOString()
}

/** A locus with no SRS state is brand new and therefore due. */
export function isDue(srs: SrsState | undefined, now: number): boolean {
  if (!srs) return true
  return new Date(srs.due).getTime() <= now
}

/** Apply a grade to a card's prior state and return its next schedule. */
export function schedule(prev: SrsState | undefined, grade: Grade, now: number): SrsState {
  let ease = prev?.ease ?? DEFAULT_EASE
  let reps = prev?.reps ?? 0
  let lapses = prev?.lapses ?? 0
  let interval = prev?.interval ?? 0

  if (grade === 'again') {
    ease = Math.max(MIN_EASE, ease - 0.2)
    lapses += 1
    reps = 0
    interval = 0 // due again today
  } else {
    if (grade === 'hard') {
      ease = Math.max(MIN_EASE, ease - 0.15)
      interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2))
    } else if (grade === 'good') {
      interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease)
    } else {
      ease = ease + 0.15
      interval = reps === 0 ? 2 : reps === 1 ? 5 : Math.round(interval * ease * 1.3)
    }
    reps += 1
  }

  return {
    ease,
    reps,
    lapses,
    interval,
    due: isoInDays(now, interval),
    lastReviewed: new Date(now).toISOString(),
  }
}

/** A card's maturity bucket, independent of whether it is due: New (never
 * successfully reviewed) → Learning (reviewed, interval still short) → Known
 * (interval matured). Due-ness is a separate, temporal concern — see `isDue`. */
export function srsStatus(srs: SrsState | undefined): SrsStatus {
  if (!srs || srs.reps === 0) return 'new'
  return srs.interval >= MATURE_INTERVAL ? 'known' : 'learning'
}

/** Force a card into a long-interval "known" schedule (manual mastery). */
export function markKnown(prev: SrsState | undefined, now: number): SrsState {
  const interval = 180
  return {
    ease: Math.max(prev?.ease ?? DEFAULT_EASE, DEFAULT_EASE),
    reps: Math.max(prev?.reps ?? 0, 3) + 1,
    lapses: prev?.lapses ?? 0,
    interval,
    due: isoInDays(now, interval),
    lastReviewed: new Date(now).toISOString(),
  }
}

/** Human-friendly preview of when a grade would schedule the card next. */
export function nextIntervalLabel(prev: SrsState | undefined, grade: Grade, now: number): string {
  const next = schedule(prev, grade, now)
  if (next.interval <= 0) return 'now'
  if (next.interval === 1) return '1d'
  if (next.interval < 30) return `${next.interval}d`
  if (next.interval < 365) return `${Math.round(next.interval / 30)}mo`
  return `${Math.round(next.interval / 365)}y`
}
