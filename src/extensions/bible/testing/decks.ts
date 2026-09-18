import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, type DeckStore, makeDeck } from '@/entities/deck'

/**
 * This extension's own deck fixture. `@/features/deck`'s fixtures are not in that slice's barrel,
 * and reaching past a barrel is the deep cross-slice import the architecture bans — `boundaries`
 * skips test files, so lint would not catch it here.
 */
export function storedDeck(id: string, over: Partial<Deck> = {}): Deck {
  return { ...makeDeck({ id, createdAt: new Date(0).toISOString(), name: id }), ...over }
}

export function startedDeckStore(decks: Deck[]): DeckStore {
  return started(createDeckStore(new InMemoryRepository<Deck>(decks)))
}
