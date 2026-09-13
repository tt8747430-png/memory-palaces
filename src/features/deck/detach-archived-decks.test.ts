import { describe, expect, it } from 'vitest'
import { heldDeck, startedDeckStore, storedDeck } from './deck-fixtures'
import { detachArchivedDecks } from './detach-archived-decks'

describe('detachArchivedDecks', () => {
  it('lifts decks archived in place out of the folder or parent they left', async () => {
    const store = startedDeckStore([
      storedDeck('filed', { archived: true, folderId: 'f1' }),
      storedDeck('main'),
      storedDeck('sub', { archived: true, parentId: 'main', order: 1 }),
      storedDeck('whole', { archived: true, order: 2 }),
      storedDeck('twig', { archived: true, parentId: 'whole' }),
    ])

    await detachArchivedDecks(store)

    expect(heldDeck(store, 'filed')).toMatchObject({
      parentId: null,
      folderId: null,
      archived: true,
    })
    expect(heldDeck(store, 'sub')).toMatchObject({ parentId: null, archived: true })
    expect(heldDeck(store, 'twig').parentId).toBe('whole')
    expect(heldDeck(store, 'main').archived).toBe(false)
  })

  it('writes nothing when the archive is already whole', async () => {
    const store = startedDeckStore([storedDeck('whole', { archived: true }), storedDeck('main')])
    const before = store.getState().decks

    await detachArchivedDecks(store)

    expect(store.getState().decks).toBe(before)
  })
})
