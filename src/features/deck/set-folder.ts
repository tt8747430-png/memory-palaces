import type { Deck, DeckStore } from '@/entities/deck'
import { editDeck } from './edit-deck'

export async function setDeckFolder(
  store: DeckStore,
  id: string,
  folderId: string | null,
): Promise<Deck> {
  return editDeck(store, id, { parentId: null, folderId })
}
