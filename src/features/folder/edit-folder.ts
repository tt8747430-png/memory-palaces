import { type Folder, type FolderChanges, type FolderStore, updateFolder } from '@/entities/folder'
import { nowIso } from '@/shared/lib'
import { requireFolder } from './require-folder'

export async function editFolder(
  store: FolderStore,
  id: string,
  changes: FolderChanges,
): Promise<Folder> {
  const next = updateFolder(requireFolder(store, id), changes, nowIso())
  await store.getState().save(next)
  return next
}
