import type { Deck, DeckStore } from '@/entities/deck'
import { editDeck } from './edit-deck'
import { requireDeck } from './require-deck'

/** Command — flip a deck's favorite flag. A dedicated command (over a raw `editDeck`) so the
 * UI and the AI Tutor share one intent-named write-path. */
export async function toggleDeckFavorite(store: DeckStore, id: string): Promise<Deck> {
  const deck = requireDeck(store, id)
  return editDeck(store, id, { favorite: !deck.favorite })
}
