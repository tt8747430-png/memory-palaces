import type { DeckFilter, DeckFilterId } from '@/shared/lib'

export interface FilterableDeck {
  id: string
  name: string
  createdAt: string
  favorite: boolean
}

/**
 * The rows a filter keeps: the Library's own three by what it knows about a deck, a contributed
 * one by what the extension knows. A filter nobody is offering — its extension switched off since
 * it was picked — hides nothing.
 *
 * Only the behaviour lives here. Which filters exist, and which one is stored, is
 * `shared/lib/deck-order.ts`, beside the order — both are settings the Library reads, and a
 * preference cannot name a type that lives in a page.
 */
export function filterDecks<T extends FilterableDeck>(
  decks: readonly T[],
  filter: DeckFilterId,
  dueCount: (deck: T) => number,
  contributed: readonly DeckFilter[],
): T[] {
  const keep = keepFor(filter, dueCount, contributed)
  return keep ? decks.filter(keep) : [...decks]
}

function keepFor<T extends FilterableDeck>(
  filter: DeckFilterId,
  dueCount: (deck: T) => number,
  contributed: readonly DeckFilter[],
): ((deck: T) => boolean) | null {
  switch (filter) {
    case 'all':
      return null
    case 'favorites':
      return (deck) => deck.favorite
    case 'due':
      return (deck) => dueCount(deck) > 0
    default: {
      const offered = contributed.find((each) => each.id === filter)
      return offered ? offered.keep : null
    }
  }
}
