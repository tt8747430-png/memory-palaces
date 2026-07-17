import type { Deck } from '@app/decks/model/deck'
import type { DeckStore } from '@app/decks/data/stores'
import { editDeck } from './edit-deck'
import { requireDeck } from './require-deck'

export async function toggleDeckFavorite(store: DeckStore, id: string): Promise<Deck> {
  const deck = requireDeck(store, id)
  return editDeck(store, id, { favorite: !deck.favorite })
}
