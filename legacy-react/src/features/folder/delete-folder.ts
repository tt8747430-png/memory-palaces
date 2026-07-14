import { type DeckStore, updateDeck } from '@/entities/deck'
import type { FolderStore } from '@/entities/folder'

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
