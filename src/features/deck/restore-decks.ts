import { type DeckPlace, type DeckStore, LIBRARY_TOP, selectDecks } from '@/entities/deck'
import { type FolderStore, selectFolders } from '@/entities/folder'
import { canReparent } from '@/shared/lib'
import { relocateDecks } from './relocate-decks'

/** A deck coming out of the archive, and — for an undo — the place it was archived from. */
export interface DeckRestore {
  id: string
  from?: DeckPlace
}

/**
 * Takes decks and their subdecks out of the archive, to the top of the library. A restore naming
 * `from` goes back there while that place is still in the library — a folder that was not deleted,
 * a parent deck neither gone nor archived itself — and to the top when it is not.
 */
export async function restoreDecks(
  deckStore: DeckStore,
  folderStore: FolderStore,
  restores: readonly DeckRestore[],
  at = Date.now(),
): Promise<void> {
  const decks = selectDecks(deckStore.getState())
  const folderIds = new Set(selectFolders(folderStore.getState()).map((f) => f.id))
  const stillThere = (id: string, place: DeckPlace): boolean =>
    place.parentId !== null
      ? decks.some((d) => d.id === place.parentId && !d.archived) &&
        canReparent(decks, id, place.parentId)
      : place.folderId === null || folderIds.has(place.folderId)
  await relocateDecks(
    deckStore,
    restores.map(({ id, from }) => ({
      id,
      to: from && stillThere(id, from) ? from : LIBRARY_TOP,
    })),
    { archived: false, at },
  )
}
