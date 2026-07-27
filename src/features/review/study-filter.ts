import { isDue, shuffle, srsStatus } from '@/shared/lib'
import type { Card } from '@/entities/card'

export function shuffleFirstDue(
  cards: Card[],
  now: number,
  shuffleCards: boolean,
  random: () => number = Math.random,
): string[] {
  const due = cards.filter((card) => isDue(card.srs, now))
  const base = (due.length > 0 ? due : cards).map((card) => card.id)
  return shuffleCards ? shuffle(base, random) : base
}

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
