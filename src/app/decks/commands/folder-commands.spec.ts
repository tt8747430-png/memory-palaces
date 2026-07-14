import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@app/shared/data'
import type { Folder } from '@app/decks/model/folder'
import { makeDeck } from '@app/decks/model/deck'
import type { Deck } from '@app/decks/model/deck'
import { createFolder } from './create-folder'
import { deleteFolder } from './delete-folder'
import { DeckStore, FolderStore } from '@app/decks/data/stores'

function folderStore() {
  const store = new FolderStore(new InMemoryRepository<Folder>())
  store.start()
  return store
}

function deckStore(seed: Deck[] = []) {
  const store = new DeckStore(new InMemoryRepository<Deck>(seed))
  store.start()
  return store
}

const deck = (id: string, folderId: string | null): Deck =>
  makeDeck({ id, createdAt: new Date(0).toISOString(), name: id, folderId })

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
    expect(store.folders().map((f) => f.id)).toEqual([folder.id])
  })
})

describe('deleteFolder', () => {
  it('removes the folder and unfiles every deck that was in it', async () => {
    const folders = folderStore()
    const created = await createFolder(folders, {
      name: 'Med school',
      color: 'from-teal-500 to-emerald-600',
      icon: '📁',
    })
    const decks = deckStore([deck('p1', created.id), deck('p2', created.id), deck('p3', null)])

    await deleteFolder(folders, decks, created.id)

    expect(folders.folders()).toHaveLength(0)
    expect(decks.decks().find((p) => p.id === 'p1')?.folderId).toBeNull()
    expect(decks.decks().find((p) => p.id === 'p2')?.folderId).toBeNull()
    expect(decks.decks().find((p) => p.id === 'p3')?.folderId).toBeNull()
  })

  it('is idempotent — deleting a missing folder unfiles nothing and does not throw', async () => {
    const folders = folderStore()
    const decks = deckStore([deck('p1', 'other')])

    await deleteFolder(folders, decks, 'ghost')

    expect(decks.decks().find((p) => p.id === 'p1')?.folderId).toBe('other')
  })
})
