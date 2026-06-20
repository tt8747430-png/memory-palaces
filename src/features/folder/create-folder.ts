import { makeFolder, type Folder, type FolderStore } from '@/entities/folder'

export interface CreateFolderInput {
  name: string
  color: string
  icon: string
}

/**
 * Command — create a folder. The single write-path used by the UI and (later) the
 * AI Tutor. Id + clock are generated here (the side-effect layer); the entity factory
 * enforces the invariants.
 */
export async function createFolder(store: FolderStore, input: CreateFolderInput): Promise<Folder> {
  const folder = makeFolder({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  await store.getState().save(folder)
  return folder
}
