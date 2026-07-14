import { type FolderStore, updateFolder } from '@/entities/folder'

export async function reorderFolders(store: FolderStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.getState().folders.map((folder) => [folder.id, folder]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const folder = byId.get(id)
      if (!folder || folder.order === index) return undefined
      return store.getState().save(updateFolder(folder, { order: index }, now))
    }),
  )
}
