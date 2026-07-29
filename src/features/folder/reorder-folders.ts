import { nowIso, reorderById } from '@/shared/lib'
import { type FolderStore, updateFolder } from '@/entities/folder'

export function reorderFolders(store: FolderStore, orderedIds: string[]): Promise<void> {
  const now = nowIso()
  return reorderById(store.getState().folders, orderedIds, (folder, order) =>
    store.getState().save(updateFolder(folder, { order }, now)),
  )
}
