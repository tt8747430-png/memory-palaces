import { updateDeck } from '@app/decks/model/deck'
import type { DeckStore, FolderStore } from '@app/decks/data/stores'

/**
 * Delete a selection of folders. Decks filed inside them are unfiled, never
 * deleted — a folder is a shelf, not a container that owns its contents.
 */
export async function deleteFolders(
  folderStore: FolderStore,
  deckStore: DeckStore,
  ids: readonly string[],
): Promise<void> {
  const targets = new Set(ids)
  const now = new Date().toISOString()
  const filed = deckStore.decks().filter((deck) => deck.folderId && targets.has(deck.folderId))
  await Promise.all(filed.map((deck) => deckStore.save(updateDeck(deck, { folderId: null }, now))))
  await Promise.all([...targets].map((id) => folderStore.remove(id)))
}
