import type { Deck } from '@/decks/model/deck'
import type { DeckStore } from '@/decks/data/stores'
import { editDeck } from './edit-deck'

export async function setDeckFolder(
  store: DeckStore,
  id: string,
  folderId: string | null,
): Promise<Deck> {
  return editDeck(store, id, { parentId: null, folderId })
}
