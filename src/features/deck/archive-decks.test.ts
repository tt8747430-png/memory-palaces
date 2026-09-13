import { describe, expect, it } from 'vitest'
import { archiveDecks } from './archive-decks'
import { heldDeck, startedDeckStore, storedDeck } from './deck-fixtures'

describe('archiveDecks', () => {
  it('lifts a filed deck out of its folder into the archive, subdecks and all', async () => {
    const store = startedDeckStore([
      storedDeck('main', { folderId: 'f1' }),
      storedDeck('sub', { parentId: 'main' }),
    ])

    await archiveDecks(store, ['main'])

    expect(heldDeck(store, 'main')).toMatchObject({
      archived: true,
      parentId: null,
      folderId: null,
    })
    expect(heldDeck(store, 'sub')).toMatchObject({ archived: true, parentId: 'main' })
  })

  it('lifts a subdeck out of its parent, keeping what the parent taught it', async () => {
    const store = startedDeckStore([
      storedDeck('main', { settings: { algorithm: 'fast' } }),
      storedDeck('sub', { parentId: 'main' }),
    ])

    await archiveDecks(store, ['sub'])

    expect(heldDeck(store, 'sub')).toMatchObject({
      archived: true,
      parentId: null,
      settings: { algorithm: 'fast' },
    })
    expect(heldDeck(store, 'main').archived).toBe(false)
  })

  it('files a batch into the archive on distinct orders, each deck carrying its own subdecks', async () => {
    const store = startedDeckStore([
      storedDeck('a', { folderId: 'f1' }),
      storedDeck('a-sub', { parentId: 'a' }),
      storedDeck('b', { folderId: 'f1', order: 1 }),
    ])

    await archiveDecks(store, ['a', 'a-sub', 'b'])

    expect(heldDeck(store, 'a-sub').parentId).toBe('a')
    expect(heldDeck(store, 'a').order).not.toBe(heldDeck(store, 'b').order)
  })
})
