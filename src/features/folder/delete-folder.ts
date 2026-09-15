import { selectDecks } from '@/entities/deck'
import type { FolderStore } from '@/entities/folder'
import { type DeleteDeckDeps, deleteDeck } from '@/features/deck'

export interface DeleteFolderDeps extends DeleteDeckDeps {
  folderStore: FolderStore
}

/**
 * A folder is deleted with what it holds: every deck filed in it, and through `deleteDeck` their
 * subdecks, cards and cover images. The archive is not in any folder (ADR 0003), so no archived
 * deck is reached.
 */
export async function deleteFolder(deps: DeleteFolderDeps, id: string): Promise<void> {
  const filed = selectDecks(deps.deckStore.getState()).filter(
    (deck) => deck.parentId === null && deck.folderId === id && !deck.archived,
  )
  await Promise.all(filed.map((deck) => deleteDeck(deps, deck.id)))
  await deps.folderStore.getState().remove(id)
}
