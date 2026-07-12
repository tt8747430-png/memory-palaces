import type { Deck, DeckStore } from '@/entities/deck'

export function requireDeck(store: DeckStore, id: string): Deck {
  const deck = store.getState().decks.find((candidate) => candidate.id === id)
  if (!deck) throw new Error(`Deck not found: ${id}`)
  return deck
}
