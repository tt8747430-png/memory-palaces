import type { FastOutcome } from './fast-outcome'
import { isDue, type SrsState, srsStatus } from './srs'

export interface StudyOverview {
  count: number
  breakdown: { new: number; learning: number; known: number }
  isCaughtUp: boolean
}

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

export function fastOverview(
  cards: ReadonlyArray<{ frozen?: boolean; fastReview?: FastOutcome }>,
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
