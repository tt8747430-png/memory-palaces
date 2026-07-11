import { isDue, shuffle, srsStatus } from '@/shared/lib'
import type { Card } from '@/entities/card'

/** Build a review queue from a scoped set of cards: lead with the cards due now (or the
 * whole set if none are due yet), optionally shuffled. The id order the session machine
 * starts from. `random` is injectable for deterministic tests. */
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

/** Which subset of a deck's cards a session studies. */
export type Scope =
  | { kind: 'all' }
  | { kind: 'due' }
  | { kind: 'new' }
  | { kind: 'learning' }
  | { kind: 'flagged' }

/** Filter a set of cards down to the active scope, preserving card order. */
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

/** Live counts per filter, for the "Cards to study" chips. */
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
