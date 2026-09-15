import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createFolderStore, type Folder } from '@/entities/folder'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { type Card, createCardStore, makeCard } from '@/entities/card'
import { createQuestionStore, type Question } from '@/entities/question'
import { LocalObjectUrlStorage } from '@/shared/api'
import { createFolder } from './create-folder'
import { deleteFolder } from './delete-folder'

const cleanup = {
  storage: new LocalObjectUrlStorage(),
  userId: null,
  questionStore: createQuestionStore(new InMemoryRepository<Question>()),
}

function folderStore() {
  const store = createFolderStore(new InMemoryRepository<Folder>())
  store.getState().start()
  return store
}

function deckStore(seed: Deck[] = []) {
  const store = createDeckStore(new InMemoryRepository<Deck>(seed))
  store.getState().start()
  return store
}

function cardStore(seed: Card[] = []) {
  const store = createCardStore(new InMemoryRepository<Card>(seed))
  store.getState().start()
  return store
}

const card = (id: string, deckId: string): Card =>
  makeCard({ id, createdAt: new Date(0).toISOString(), deckId, front: id, back: id })

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
    expect(store.getState().folders.map((f) => f.id)).toEqual([folder.id])
  })
})

describe('deleteFolder', () => {
  it('deletes the folder with every deck filed in it, their subdecks and their cards', async () => {
    const folders = folderStore()
    const created = await createFolder(folders, {
      name: 'Med school',
      color: 'from-teal-500 to-emerald-600',
      icon: '📁',
    })
    const decks = deckStore([
      deck('p1', created.id),
      deck('p2', created.id),
      { ...deck('p1-sub', null), parentId: 'p1' },
      deck('p3', null),
    ])
    const cards = cardStore([card('c1', 'p1'), card('c2', 'p1-sub'), card('c3', 'p3')])

    await deleteFolder(
      { folderStore: folders, deckStore: decks, cardStore: cards, ...cleanup },
      created.id,
    )

    expect(folders.getState().folders).toHaveLength(0)
    expect(decks.getState().decks.map((d) => d.id)).toEqual(['p3'])
    expect(cards.getState().cards.map((c) => c.id)).toEqual(['c3'])
  })

  it('leaves the archive alone — an archived deck is no longer in any folder', async () => {
    const folders = folderStore()
    const decks = deckStore([{ ...deck('old', null), archived: true }, deck('p1', 'f1')])

    await deleteFolder(
      { folderStore: folders, deckStore: decks, cardStore: cardStore(), ...cleanup },
      'f1',
    )

    expect(decks.getState().decks.map((d) => d.id)).toEqual(['old'])
  })

  it('is idempotent — deleting a missing folder deletes nothing and does not throw', async () => {
    const folders = folderStore()
    const decks = deckStore([deck('p1', 'other')])

    await deleteFolder(
      { folderStore: folders, deckStore: decks, cardStore: cardStore(), ...cleanup },
      'ghost',
    )

    expect(decks.getState().decks.find((p) => p.id === 'p1')?.folderId).toBe('other')
  })
})
