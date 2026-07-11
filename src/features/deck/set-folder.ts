import type { Deck, DeckStore } from '@/entities/deck'
import { editDeck } from './edit-deck'

/** Command — file a top-level deck into a folder, or unfile it with `null`. The folder is just
 * a grouping; this only changes the deck's `folderId`. (A subdeck cannot be folder-filed; move
 * it to the root first with `moveDeck`.) */
export async function setDeckFolder(
  store: DeckStore,
  id: string,
  folderId: string | null,
): Promise<Deck> {
  return editDeck(store, id, { parentId: null, folderId })
}
