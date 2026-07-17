import { updateFolder } from '@app/decks/model/folder'
import type { FolderStore } from '@app/decks/data/stores'

export async function reorderFolders(store: FolderStore, orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  const byId = new Map(store.folders().map((folder) => [folder.id, folder]))
  await Promise.all(
    orderedIds.map((id, index) => {
      const folder = byId.get(id)
      if (!folder || folder.order === index) return undefined
      return store.save(updateFolder(folder, { order: index }, now))
    }),
  )
}
