import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createFolderStore, type Folder } from '@/entities/folder'
import { createPalaceStore, makePalace, type Palace } from '@/entities/palace'
import { createFolder } from './create-folder'
import { deleteFolder } from './delete-folder'

function folderStore() {
  const store = createFolderStore(new InMemoryRepository<Folder>())
  store.getState().start()
  return store
}

function palaceStore(seed: Palace[] = []) {
  const store = createPalaceStore(new InMemoryRepository<Palace>(seed))
  store.getState().start()
  return store
}

const palace = (id: string, folderId: string | null): Palace =>
  makePalace({ id, createdAt: new Date(0).toISOString(), name: id, folderId })

describe('createFolder', () => {
  it('creates and persists a folder with a generated id and trimmed name', async () => {
    const store = folderStore()

    const folder = await createFolder(store, {
      name: '  Languages  ',
      color: 'from-sky-500 to-blue-600',
      icon: '📁',
    })

    expect(folder.id).toBeTruthy()
    expect(folder.name).toBe('Languages')
    expect(store.getState().folders.map((f) => f.id)).toEqual([folder.id])
  })
})

describe('deleteFolder', () => {
  it('removes the folder and unfiles every palace that was in it', async () => {
    const folders = folderStore()
    const created = await createFolder(folders, {
      name: 'Med school',
      color: 'from-teal-500 to-emerald-600',
      icon: '📁',
    })
    const palaces = palaceStore([
      palace('p1', created.id),
      palace('p2', created.id),
      palace('p3', null),
    ])

    await deleteFolder(folders, palaces, created.id)

    expect(folders.getState().folders).toHaveLength(0)
    expect(palaces.getState().palaces.find((p) => p.id === 'p1')?.folderId).toBeNull()
    expect(palaces.getState().palaces.find((p) => p.id === 'p2')?.folderId).toBeNull()
    // A palace that was never in the folder is untouched.
    expect(palaces.getState().palaces.find((p) => p.id === 'p3')?.folderId).toBeNull()
  })

  it('is idempotent — deleting a missing folder unfiles nothing and does not throw', async () => {
    const folders = folderStore()
    const palaces = palaceStore([palace('p1', 'other')])

    await deleteFolder(folders, palaces, 'ghost')

    expect(palaces.getState().palaces.find((p) => p.id === 'p1')?.folderId).toBe('other')
  })
})
