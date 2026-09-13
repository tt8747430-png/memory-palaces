import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, type DeckStore, makeDeck } from '@/entities/deck'

/**
 * A deck for the slice's tests, built past `makeDeck` so it can carry what one stored before the
 * current rules did — an archived deck still in its folder, a subdeck left under its parent.
 */
export function storedDeck(id: string, over: Partial<Deck> = {}): Deck {
  return { ...makeDeck({ id, createdAt: new Date(0).toISOString(), name: id }), ...over }
}

/** A deck store already holding `decks`, started the way the composition root starts it. */
export function startedDeckStore(decks: Deck[]): DeckStore {
  return started(createDeckStore(new InMemoryRepository<Deck>(decks)))
}

/** The deck the store holds now. Throws when it is gone, so the test fails where it looked. */
export function heldDeck(store: DeckStore, id: string): Deck {
  const deck = store.getState().decks.find((d) => d.id === id)
  if (!deck) throw new Error(`The store holds no deck ${id}`)
  return deck
}
