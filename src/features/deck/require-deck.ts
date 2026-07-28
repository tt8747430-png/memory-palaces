import { requireEntity } from '@/shared/lib'
import type { Deck, DeckStore } from '@/entities/deck'

export function requireDeck(store: DeckStore, id: string): Deck {
  return requireEntity(store.getState().decks, id, 'Deck')
}
