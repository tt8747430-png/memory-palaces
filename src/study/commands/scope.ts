import { isDue, shuffle, srsStatus } from '@/shared/domain'
import type { Card } from '@/decks'

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

export type Scope =
  { kind: 'all' } | { kind: 'due' } | { kind: 'new' } | { kind: 'learning' } | { kind: 'flagged' }

export function applyScope(cards: Card[], scope: Scope, now: number): Card[] {
  switch (scope.kind) {
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

export interface ScopeCounts {
  all: number
  due: number
  new: number
  learning: number
  flagged: number
}

export function scopeCounts(cards: Card[], now: number): ScopeCounts {
  return {
    all: cards.length,
    due: cards.filter((card) => isDue(card.srs, now)).length,
    new: cards.filter((card) => srsStatus(card.srs) === 'new').length,
    learning: cards.filter((card) => srsStatus(card.srs) === 'learning').length,
    flagged: cards.filter((card) => card.flagged).length,
  }
}

export function scopesEqual(a: Scope, b: Scope): boolean {
  return a.kind === b.kind
}
