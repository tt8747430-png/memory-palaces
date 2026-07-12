import { type Folder, type FolderChanges, type FolderStore, updateFolder } from '@/entities/folder'

export async function editFolder(
  store: FolderStore,
  folder: Folder,
  changes: FolderChanges,
): Promise<Folder> {
  const next = updateFolder(folder, changes, new Date().toISOString())
  await store.getState().save(next)
  return next
}
