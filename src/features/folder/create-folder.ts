import { type Folder, type FolderStore, makeFolder } from '@/entities/folder'
import { newId, nextOrder, nowIso } from '@/shared/lib'

export interface CreateFolderInput {
  name: string
  color: string
  icon: string
}

export async function createFolder(
  store: FolderStore,
  input: CreateFolderInput,
  now: number = Date.now(),
): Promise<Folder> {
  const order = nextOrder(store.getState().folders)
  const folder = makeFolder({
    ...input,
    order,
    id: newId(),
    createdAt: nowIso(now),
  })
  await store.getState().save(folder)
  return folder
}
