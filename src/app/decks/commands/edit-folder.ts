import { updateFolder } from '@app/decks/model/folder'
import type { Folder, FolderChanges } from '@app/decks/model/folder'
import type { FolderStore } from '@app/decks/data/stores'

export async function editFolder(
  store: FolderStore,
  folder: Folder,
  changes: FolderChanges,
): Promise<Folder> {
  const next = updateFolder(folder, changes, new Date().toISOString())
  await store.save(next)
  return next
}
