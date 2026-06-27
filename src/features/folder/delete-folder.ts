import { type PalaceStore, updatePalace } from '@/entities/palace'
import type { FolderStore } from '@/entities/folder'

/**
 * Command — delete a folder. A folder is only a grouping, so its palaces survive:
 * any palace filed here is moved back to Unfiled (`folderId: null`) before the folder
 * record is removed, so no palace is left pointing at a folder that no longer exists.
 * Idempotent — deleting a missing folder just unfiles nothing.
 */
export async function deleteFolder(
  folderStore: FolderStore,
  palaceStore: PalaceStore,
  id: string,
): Promise<void> {
  const now = new Date().toISOString()
  const filed = palaceStore.getState().palaces.filter((palace) => palace.folderId === id)
  await Promise.all(
    filed.map((palace) =>
      palaceStore.getState().save(updatePalace(palace, { folderId: null }, now)),
    ),
  )
  await folderStore.getState().remove(id)
}
