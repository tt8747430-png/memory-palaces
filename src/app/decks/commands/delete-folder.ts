import { updateDeck } from '@app/decks/model/deck'
import type { DeckStore } from '@app/decks/data/stores'
import type { FolderStore } from '@app/decks/data/stores'

export async function deleteFolder(
  folderStore: FolderStore,
  deckStore: DeckStore,
  id: string,
): Promise<void> {
  const now = new Date().toISOString()
  const filed = deckStore.decks().filter((deck) => deck.folderId === id)
  await Promise.all(filed.map((deck) => deckStore.save(updateDeck(deck, { folderId: null }, now))))
  await folderStore.remove(id)
}
