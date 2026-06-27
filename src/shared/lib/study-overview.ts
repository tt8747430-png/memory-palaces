import { isDue, type SrsState, srsStatus } from './srs'

/**
 * The study-overview numbers for a scope's cards: how many are due today and the
 * New/Learning/Known split of just that due set. The single definition of "cards for
 * today + its breakdown" that the room hub and palace detail both render — they pass
 * their already-scoped loci (room set or the whole palace) so this stays below the
 * entity layer. Pure; `now` injected. One pass over the loci.
 */
export interface StudyOverview {
  /** Cards for today (due) in the scope. */
  count: number
  /** Maturity split (New/Learning/Known) of the due set only. */
  breakdown: { new: number; learning: number; known: number }
  /** Nothing is due — the caught-up state. */
  isCaughtUp: boolean
}

export function studyOverview(loci: ReadonlyArray<{ srs?: SrsState }>, now: number): StudyOverview {
  const breakdown = { new: 0, learning: 0, known: 0 }
  let count = 0
  for (const locus of loci) {
    if (!isDue(locus.srs, now)) continue
    count += 1
    breakdown[srsStatus(locus.srs)] += 1
  }
  return { count, breakdown, isCaughtUp: count === 0 }
}
