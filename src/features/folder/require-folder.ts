import { requireEntity } from '@/shared/lib'
import type { Folder, FolderStore } from '@/entities/folder'

export function requireFolder(store: FolderStore, id: string): Folder {
  return requireEntity(store.getState().folders, id, 'Folder')
}
