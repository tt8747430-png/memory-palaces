import type { Deck, DeckStore } from '@/entities/deck'
import { editDeck } from './edit-deck'

/** Command — archive or restore a deck. Archived decks leave the main list but keep all their
 * subdecks, cards, and progress; restoring brings them straight back. */
export async function setDeckArchived(
  store: DeckStore,
  id: string,
  archived: boolean,
): Promise<Deck> {
  return editDeck(store, id, { archived })
}
