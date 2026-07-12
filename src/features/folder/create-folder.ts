import { type Folder, type FolderStore, makeFolder } from '@/entities/folder'

export interface CreateFolderInput {
  name: string
  color: string
  icon: string
}

export async function createFolder(store: FolderStore, input: CreateFolderInput): Promise<Folder> {
  const existing = store.getState().folders
  const order = existing.length ? Math.max(...existing.map((f) => f.order)) + 1 : 0
  const folder = makeFolder({
    ...input,
    order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  await store.getState().save(folder)
  return folder
}
