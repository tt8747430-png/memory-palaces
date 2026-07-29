import { type DeckStore, updateDeck } from '@/entities/deck'
import type { FolderStore } from '@/entities/folder'
import { nowIso } from '@/shared/lib'

export async function deleteFolder(
  folderStore: FolderStore,
  deckStore: DeckStore,
  id: string,
): Promise<void> {
  const now = nowIso()
  const filed = deckStore.getState().decks.filter((deck) => deck.folderId === id)
  await Promise.all(
    filed.map((deck) => deckStore.getState().save(updateDeck(deck, { folderId: null }, now))),
  )
  await folderStore.getState().remove(id)
}
