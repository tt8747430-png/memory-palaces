import { type Folder, type FolderChanges, type FolderStore, updateFolder } from '@/entities/folder'

/**
 * Command — edit a folder's name, colour, or icon. The single write-path used by the UI
 * and (later) the AI Tutor. The clock is generated here (the side-effect layer); the
 * entity transform enforces the invariants.
 */
export async function editFolder(
  store: FolderStore,
  folder: Folder,
  changes: FolderChanges,
): Promise<Folder> {
  const next = updateFolder(folder, changes, new Date().toISOString())
  await store.getState().save(next)
  return next
}
