import { type DeckStore, updateDeck } from '@/entities/deck'
import type { FolderStore } from '@/entities/folder'

/**
 * Command — delete a folder. A folder is only a grouping, so its decks survive: any top-level
 * deck filed here is moved back to the root (`folderId: null`) before the folder record is
 * removed, so no deck is left pointing at a folder that no longer exists. Idempotent —
 * deleting a missing folder just unfiles nothing.
 */
export async function deleteFolder(
  folderStore: FolderStore,
  deckStore: DeckStore,
  id: string,
): Promise<void> {
  const now = new Date().toISOString()
  const filed = deckStore.getState().decks.filter((deck) => deck.folderId === id)
  await Promise.all(
    filed.map((deck) => deckStore.getState().save(updateDeck(deck, { folderId: null }, now))),
  )
  await folderStore.getState().remove(id)
}
