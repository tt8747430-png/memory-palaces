import { reorderById } from '@/shared/lib'
import { type FolderStore, updateFolder } from '@/entities/folder'

export function reorderFolders(store: FolderStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  return reorderById(store.getState().folders, orderedIds, (folder, order) =>
    store.getState().save(updateFolder(folder, { order }, now)),
  )
}
