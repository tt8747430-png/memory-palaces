import type { Deck, DeckStore } from '@/entities/deck'
import { editDeck } from './edit-deck'

export async function setDeckArchived(
  store: DeckStore,
  id: string,
  archived: boolean,
): Promise<Deck> {
  return editDeck(store, id, { archived })
}
