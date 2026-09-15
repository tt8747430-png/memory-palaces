import { selectDecks } from '@/entities/deck'
import type { FolderStore } from '@/entities/folder'
import { type DeleteDeckDeps, deleteDeck } from '@/features/deck'

export interface DeleteFolderDeps extends DeleteDeckDeps {
  folderStore: FolderStore
}

export async function deleteFolder(deps: DeleteFolderDeps, id: string): Promise<void> {
  const filed = selectDecks(deps.deckStore.getState()).filter(
    (deck) => deck.parentId === null && deck.folderId === id && !deck.archived,
  )
  await Promise.all(filed.map((deck) => deleteDeck(deps, deck.id)))
  await deps.folderStore.getState().remove(id)
}
