import type { CardStore } from '@/entities/card'
import { type DeckStore, selectDecks } from '@/entities/deck'
import type { FolderStore } from '@/entities/folder'
import { deleteDeck } from '@/features/deck'

/**
 * A folder is deleted with what it holds: every deck filed in it, and through `deleteDeck` their
 * subdecks and cards. The archive is not in any folder (ADR 0003), so no archived deck is reached.
 */
export async function deleteFolder(
  folderStore: FolderStore,
  deckStore: DeckStore,
  cardStore: CardStore,
  id: string,
): Promise<void> {
  const filed = selectDecks(deckStore.getState()).filter(
    (deck) => deck.parentId === null && deck.folderId === id && !deck.archived,
  )
  await Promise.all(filed.map((deck) => deleteDeck(deckStore, cardStore, deck.id)))
  await folderStore.getState().remove(id)
}
