import type { Deck, DeckStore } from '@/entities/deck'
import { editDeck } from './deck-commands'
import { requireDeck } from './deck-commands'

export async function toggleDeckFavorite(store: DeckStore, id: string): Promise<Deck> {
  const deck = requireDeck(store, id)
  return editDeck(store, id, { favorite: !deck.favorite })
}
