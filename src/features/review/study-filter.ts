import { isDue, shuffle, srsStatus } from '@/shared/lib'
import type { Card } from '@/entities/card'
import type { LearningAlgorithm } from '@/entities/deck'

export type StudyFilter =
  { kind: 'all' } | { kind: 'due' } | { kind: 'new' } | { kind: 'learning' } | { kind: 'flagged' }

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
  /**
   * A card the learner asked for by name. The session is a run from it: that card and every
   * live card after it, in deck order, whatever their schedules say and however the deck would
   * shuffle — an explicit ask is not the deck's normal rotation. The card itself comes in even
   * frozen; the frozen ones after it do not. Only the daily maximum still applies.
   */
  startAt?: string
}

function withNewCardLimit(cards: Card[], newCardsPerDay: number): Card[] {
  let budget = newCardsPerDay
  return cards.filter((card) => {
    if (srsStatus(card.srs) !== 'new') return true
    if (budget <= 0) return false
    budget -= 1
    return true
  })
}

export function buildStudyQueue(cards: Card[], options: QueueOptions): string[] {
  const { now, algorithm, shuffle: shouldShuffle, random = Math.random } = options
  const from = options.startAt === undefined ? -1 : cards.findIndex((c) => c.id === options.startAt)
  if (from >= 0) {
    return cards
      .filter((card, i) => i === from || (i > from && !card.frozen))
      .slice(0, options.maxCardsPerDay)
      .map((card) => card.id)
  }
  const live = cards.filter((card) => !card.frozen)

  let chosen: Card[]
  if (algorithm === 'fast') {
    // A Fast pass remembers: a card got right is done with until the learner resets it or the
    // pass is complete. Otherwise every session re-offers the whole deck, and answering a card
    // changes nothing the learner can see.
    const left = live.filter((card) => card.fastReview !== 'gotIt')
    chosen = left.length > 0 ? left : live
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

  const ids = chosen.slice(0, options.maxCardsPerDay).map((card) => card.id)
  return shouldShuffle ? shuffle(ids, random) : ids
}
