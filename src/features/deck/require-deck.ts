import type { Deck, DeckStore } from '@/entities/deck'

/** Read a deck from the store's reactive state, or fail loudly. Edit/duplicate commands run
 * against a started store, so the list is already hydrated. */
export function requireDeck(store: DeckStore, id: string): Deck {
  const deck = store.getState().decks.find((candidate) => candidate.id === id)
  if (!deck) throw new Error(`Deck not found: ${id}`)
  return deck
}
