import { makeFolder } from '@app/decks/model/folder'
import type { Folder } from '@app/decks/model/folder'
import type { FolderStore } from '@app/decks/data/stores'

export interface CreateFolderInput {
  name: string
  color: string
  icon: string
}

export async function createFolder(store: FolderStore, input: CreateFolderInput): Promise<Folder> {
  const existing = store.folders()
  const order = existing.length ? Math.max(...existing.map((f) => f.order)) + 1 : 0
  const folder = makeFolder({
    ...input,
    order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  await store.save(folder)
  return folder
}
