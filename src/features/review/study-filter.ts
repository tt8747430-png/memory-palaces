import { isDue, shuffle, srsStatus } from '@/shared/lib'
import type { Card } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'

export type StudyFilter =
  | { kind: 'all' }
  | { kind: 'due' }
  | { kind: 'new' }
  | { kind: 'learning' }
  | { kind: 'flagged' }

export function applyStudyFilter(cards: Card[], filter: StudyFilter, now: number): Card[] {
  switch (filter.kind) {
    case 'due':
      return cards.filter((card) => isDue(card.srs, now))
    case 'new':
      return cards.filter((card) => srsStatus(card.srs) === 'new')
    case 'learning':
      return cards.filter((card) => srsStatus(card.srs) === 'learning')
    case 'flagged':
      return cards.filter((card) => card.flagged)
    default:
      return cards
  }
}

export interface StudyFilterCounts {
  all: number
  due: number
  new: number
  learning: number
  flagged: number
}

export function studyFilterCounts(cards: Card[], now: number): StudyFilterCounts {
  return {
    all: cards.length,
    due: cards.filter((card) => isDue(card.srs, now)).length,
    new: cards.filter((card) => srsStatus(card.srs) === 'new').length,
    learning: cards.filter((card) => srsStatus(card.srs) === 'learning').length,
    flagged: cards.filter((card) => card.flagged).length,
  }
}

export function studyFiltersEqual(a: StudyFilter, b: StudyFilter): boolean {
  return a.kind === b.kind
}

export interface QueueOptions {
  now: number
  algorithm: LearningAlgorithm
  shuffle: boolean
  newCardsPerDay: number
  maxCardsPerDay: number
  random?: () => number
}

/** Admits every studied card and only the day's allowance of never-studied ones, in queue order. */
function withNewCardLimit(cards: Card[], newCardsPerDay: number): Card[] {
  let budget = newCardsPerDay
  return cards.filter((card) => {
    if (srsStatus(card.srs) !== 'new') return true
    if (budget <= 0) return false
    budget -= 1
    return true
  })
}

/**
 * The one place a study queue is built. Fast review ignores schedules entirely — every unfrozen
 * card is on offer, capped only by the day's ceiling, which is the whole point of it and what the
 * deck screen's count promises. Spaced repetition takes what is due and tops up with new cards to
 * the day's allowance. Neither ever sees a frozen card.
 *
 * The new-card allowance is a spaced-repetition idea and belongs to it alone: fast review has no
 * row for it, and applying it here would make the deck screen advertise a queue it cannot serve.
 *
 * When spaced repetition has nothing due, the queue falls back to every live card rather than
 * coming back empty: that fallback is what "Study ahead" on a caught-up deck rides on.
 */
export function buildStudyQueue(cards: Card[], options: QueueOptions): string[] {
  const { now, algorithm, shuffle: shouldShuffle, random = Math.random } = options
  const live = cards.filter((card) => !card.frozen)

  let chosen: Card[]
  if (algorithm === 'fast') {
    chosen = live
  } else {
    const due = [
      ...live.filter((card) => srsStatus(card.srs) !== 'new' && isDue(card.srs, now)),
      ...withNewCardLimit(
        live.filter((card) => srsStatus(card.srs) === 'new'),
        options.newCardsPerDay,
      ),
    ]
    chosen = due.length > 0 ? due : withNewCardLimit(live, options.newCardsPerDay)
  }

  const capped = chosen.slice(0, options.maxCardsPerDay)
  const ids = capped.map((card) => card.id)
  return shouldShuffle ? shuffle(ids, random) : ids
}
