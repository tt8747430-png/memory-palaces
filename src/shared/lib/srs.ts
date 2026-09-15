import { DAY_MS, nowIso } from './clock'

export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  due: string
  interval: number
  ease: number
  reps: number
  lapses: number
  lastReviewed: string
}

export type SrsStatus = 'new' | 'learning' | 'known'

const MIN_EASE = 1.3

/** Where a card's ease starts, and what an unstudied card is shown as. */
export const DEFAULT_EASE = 2.5

/** At this interval a card stops being "learning" and counts as mastered. */
const MATURE_INTERVAL_DAYS = 21

function isoInDays(now: number, days: number): string {
  return new Date(now + days * DAY_MS).toISOString()
}

export function isDue(srs: SrsState | undefined, now: number): boolean {
  if (!srs) return true
  return new Date(srs.due).getTime() <= now
}

export function schedule(prev: SrsState | undefined, grade: Grade, now: number): SrsState {
  let ease = prev?.ease ?? DEFAULT_EASE
  let reps = prev?.reps ?? 0
  let lapses = prev?.lapses ?? 0
  let interval = prev?.interval ?? 0

  if (grade === 'again') {
    ease = Math.max(MIN_EASE, ease - 0.2)
    lapses += 1
    reps = 0
    interval = 0
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
    lastReviewed: nowIso(now),
  }
}

export function srsStatus(srs: SrsState | undefined): SrsStatus {
  if (!srs || srs.reps === 0) return 'new'
  return srs.interval >= MATURE_INTERVAL_DAYS ? 'known' : 'learning'
}

function carryOver(prev: SrsState | undefined, now: number): SrsState {
  return {
    ease: prev?.ease ?? DEFAULT_EASE,
    reps: prev?.reps ?? 0,
    lapses: prev?.lapses ?? 0,
    interval: prev?.interval ?? 0,
    due: prev?.due ?? nowIso(now),
    lastReviewed: prev?.lastReviewed ?? nowIso(now),
  }
}

/**
 * Puts a card in the learning band by hand. It keeps the card's record — ease,
 * reps, lapses — and only moves the interval to where `srsStatus` reads
 * "learning", so a hand-set status and a studied one mean the same thing.
 */
export function markLearning(prev: SrsState | undefined, now: number): SrsState {
  const base = carryOver(prev, now)
  const interval = Math.min(Math.max(base.interval, 1), MATURE_INTERVAL_DAYS - 1)
  return { ...base, reps: Math.max(base.reps, 1), interval, due: isoInDays(now, interval) }
}

/** Moves the next review to a chosen day, leaving ease, reps and lapses alone. */
export function scheduleOn(prev: SrsState | undefined, dueMs: number, now: number): SrsState {
  const base = carryOver(prev, now)
  const interval = Math.max(0, Math.round((dueMs - now) / DAY_MS))
  return {
    ...base,
    reps: Math.max(base.reps, 1),
    interval,
    due: new Date(dueMs).toISOString(),
  }
}

/** Whole days from `now` to a scheduled review, floored at zero. */
export function daysUntilDue(srs: SrsState | undefined, now: number): number {
  if (!srs) return 0
  return Math.max(0, Math.round((new Date(srs.due).getTime() - now) / DAY_MS))
}

export function markKnown(prev: SrsState | undefined, now: number): SrsState {
  const interval = 180
  return {
    ease: Math.max(prev?.ease ?? DEFAULT_EASE, DEFAULT_EASE),
    reps: Math.max(prev?.reps ?? 0, 3) + 1,
    lapses: prev?.lapses ?? 0,
    interval,
    due: isoInDays(now, interval),
    lastReviewed: nowIso(now),
  }
}

export function intervalLabel(days: number): string {
  if (days <= 0) return 'now'
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

export function nextIntervalLabel(prev: SrsState | undefined, grade: Grade, now: number): string {
  return intervalLabel(schedule(prev, grade, now).interval)
}
