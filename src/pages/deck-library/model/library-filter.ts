import type { DeckFilter } from '@/shared/lib'

export type { DeckFilter }

/** The filters the Library itself knows. Transient: a way of finding rows, not a setting. */
export const CORE_LIBRARY_FILTERS = ['all', 'favorites', 'due'] as const

export type CoreLibraryFilter = (typeof CORE_LIBRARY_FILTERS)[number]

/** A core filter, or the id of one an extension contributed — open, but the three names complete. */
export type LibraryFilter = CoreLibraryFilter | (string & {})

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
 */
export function filterDecks<T extends FilterableDeck>(
  decks: readonly T[],
  filter: LibraryFilter,
  dueCount: (deck: T) => number,
  contributed: readonly DeckFilter[],
): T[] {
  const keep = keepFor(filter, dueCount, contributed)
  return keep ? decks.filter(keep) : [...decks]
}

function keepFor<T extends FilterableDeck>(
  filter: LibraryFilter,
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
