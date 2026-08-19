import { isDue, type SrsState, srsStatus } from './srs'

export interface StudyOverview {
  count: number
  breakdown: { new: number; learning: number; known: number }
  isCaughtUp: boolean
}

/** A frozen card is not on offer, so it must not be counted as owed either. */
export function studyOverview(
  cards: ReadonlyArray<{ srs?: SrsState; frozen?: boolean }>,
  now: number,
): StudyOverview {
  const breakdown = { new: 0, learning: 0, known: 0 }
  let count = 0
  for (const card of cards) {
    if (card.frozen) continue
    if (!isDue(card.srs, now)) continue
    count += 1
    breakdown[srsStatus(card.srs)] += 1
  }
  return { count, breakdown, isCaughtUp: count === 0 }
}

export interface FastOverview {
  count: number
  breakdown: { notStudied: number; notQuite: number; gotIt: number }
}

/**
 * Fast review's face of a deck. There is no schedule to consult, so what is on offer is simply
 * every unfrozen card, capped by the day's ceiling — and the breakdown says how far the learner
 * has got with them rather than when each is next owed.
 */
export function fastOverview(
  cards: ReadonlyArray<{ frozen?: boolean; fastReview?: 'notQuite' | 'gotIt' }>,
  maxCardsPerDay: number,
): FastOverview {
  const live = cards.filter((card) => !card.frozen)
  const breakdown = { notStudied: 0, notQuite: 0, gotIt: 0 }
  for (const card of live) {
    if (card.fastReview === 'gotIt') breakdown.gotIt += 1
    else if (card.fastReview === 'notQuite') breakdown.notQuite += 1
    else breakdown.notStudied += 1
  }
  return { count: Math.min(live.length, maxCardsPerDay), breakdown }
}
