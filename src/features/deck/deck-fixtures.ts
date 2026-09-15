import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, type DeckStore, makeDeck } from '@/entities/deck'

export function storedDeck(id: string, over: Partial<Deck> = {}): Deck {
  return { ...makeDeck({ id, createdAt: new Date(0).toISOString(), name: id }), ...over }
}

export function startedDeckStore(decks: Deck[]): DeckStore {
  return started(createDeckStore(new InMemoryRepository<Deck>(decks)))
}

export function heldDeck(store: DeckStore, id: string): Deck {
  const deck = store.getState().decks.find((d) => d.id === id)
  if (!deck) throw new Error(`The store holds no deck ${id}`)
  return deck
}
