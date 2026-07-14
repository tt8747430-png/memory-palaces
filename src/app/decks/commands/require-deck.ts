import type { Deck } from '@app/decks/model/deck'
import type { DeckStore } from '@app/decks/data/stores'

export function requireDeck(store: DeckStore, id: string): Deck {
  const deck = store.decks().find((candidate) => candidate.id === id)
  if (!deck) throw new Error(`Deck not found: ${id}`)
  return deck
}
