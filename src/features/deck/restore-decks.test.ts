import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createFolderStore, type Folder, makeFolder } from '@/entities/folder'
import { heldDeck, startedDeckStore, storedDeck } from './deck-fixtures'
import { restoreDecks } from './restore-decks'

const at = new Date(0).toISOString()

const foldersOf = (ids: string[] = []) =>
  started(
    createFolderStore(
      new InMemoryRepository<Folder>(
        ids.map((id) => makeFolder({ id, createdAt: at, name: id, color: 'sky', icon: '📁' })),
      ),
    ),
  )

describe('restoreDecks', () => {
  it('lands at the top of the library, after what is already there', async () => {
    const store = startedDeckStore([
      storedDeck('a', { order: 0 }),
      storedDeck('b', { order: 4 }),
      storedDeck('old', { archived: true, order: 1 }),
      storedDeck('sub', { parentId: 'old', archived: true }),
    ])

    await restoreDecks(store, foldersOf(), [{ id: 'old' }])

    expect(heldDeck(store, 'old')).toMatchObject({ archived: false, parentId: null, order: 5 })
    expect(heldDeck(store, 'sub')).toMatchObject({ archived: false, parentId: 'old' })
  })

  it('goes back to the folder it came from while that folder is still there', async () => {
    const store = startedDeckStore([storedDeck('old', { archived: true })])

    await restoreDecks(store, foldersOf(['f1']), [
      { id: 'old', from: { parentId: null, folderId: 'f1' } },
    ])

    expect(heldDeck(store, 'old')).toMatchObject({ archived: false, folderId: 'f1' })
  })

  it('goes back under the deck it came from while that deck is still in the library', async () => {
    const store = startedDeckStore([
      storedDeck('main'),
      storedDeck('old', { archived: true, order: 1 }),
    ])

    await restoreDecks(store, foldersOf(), [
      { id: 'old', from: { parentId: 'main', folderId: null } },
    ])

    expect(heldDeck(store, 'old')).toMatchObject({ archived: false, parentId: 'main' })
  })

  it('lands at the top when the place it came from is gone', async () => {
    const store = startedDeckStore([
      storedDeck('main', { archived: true }),
      storedDeck('a', { archived: true, order: 1 }),
      storedDeck('b', { archived: true, order: 2 }),
    ])

    await restoreDecks(store, foldersOf(), [
      { id: 'a', from: { parentId: 'main', folderId: null } },
      { id: 'b', from: { parentId: null, folderId: 'deleted' } },
    ])

    expect(heldDeck(store, 'a')).toMatchObject({ archived: false, parentId: null })
    expect(heldDeck(store, 'b')).toMatchObject({ archived: false, folderId: null })
    expect(heldDeck(store, 'a').order).not.toBe(heldDeck(store, 'b').order)
  })
})
