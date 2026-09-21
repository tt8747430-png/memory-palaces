/**
 * How the Library arranges decks. `manual` is the order a drag writes — it is not an arrangement at
 * all, it is the absence of one, which is why it hands the list back untouched.
 */
export const DECK_SORTS = ['manual', 'name', 'recent', 'due'] as const

export type DeckSort = (typeof DECK_SORTS)[number]

export const DEFAULT_DECK_SORT: DeckSort = 'manual'

export interface SortableDeck {
  name: string
  createdAt: string
}

/**
 * The read-side twin of the schema step that added the setting: a document pulled from a device
 * that has never heard of it arrives without the field, and replication does not migrate.
 */
export function resolveDeckSort(stored?: unknown): DeckSort {
  return (DECK_SORTS as readonly unknown[]).includes(stored)
    ? (stored as DeckSort)
    : DEFAULT_DECK_SORT
}

/**
 * `due` counts what is waiting, which only the caller can work out — it needs the cards. Ties fall
 * back to the name so that a shelf of decks with nothing due is still in a readable order rather
 * than whatever order the store happened to hand over.
 */
export function sortDecks<T extends SortableDeck>(
  decks: readonly T[],
  sort: DeckSort,
  dueCount: (deck: T) => number = () => 0,
): T[] {
  switch (sort) {
    case 'name':
      return decks.toSorted((a, b) => a.name.localeCompare(b.name))
    case 'recent':
      return decks.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'due':
      return decks.toSorted((a, b) => dueCount(b) - dueCount(a) || a.name.localeCompare(b.name))
    case 'manual':
      return [...decks]
  }
}
