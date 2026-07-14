import { isDue, type SrsState, srsStatus } from './srs'

export interface StudyOverview {
  count: number
  breakdown: { new: number; learning: number; known: number }
  isCaughtUp: boolean
}

export function studyOverview(
  cards: readonly { srs?: SrsState }[],
  now: number,
): StudyOverview {
  const breakdown = { new: 0, learning: 0, known: 0 }
  let count = 0
  for (const card of cards) {
    if (!isDue(card.srs, now)) continue
    count += 1
    breakdown[srsStatus(card.srs)] += 1
  }
  return { count, breakdown, isCaughtUp: count === 0 }
}
