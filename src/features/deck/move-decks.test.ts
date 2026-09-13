import { describe, expect, it } from 'vitest'
import { LIBRARY_TOP } from '@/entities/deck'
import { heldDeck, startedDeckStore, storedDeck } from './deck-fixtures'
import { moveDecks } from './move-decks'

describe('moveDecks', () => {
  it('moves only the decks named — their subdecks stay under them', async () => {
    const store = startedDeckStore([
      storedDeck('main', { folderId: 'f1' }),
      storedDeck('sub', { parentId: 'main' }),
      storedDeck('leaf', { parentId: 'sub' }),
    ])

    await moveDecks(store, [{ id: 'main', to: LIBRARY_TOP }])

    expect(heldDeck(store, 'main')).toMatchObject({ parentId: null, folderId: null })
    expect(heldDeck(store, 'sub').parentId).toBe('main')
    expect(heldDeck(store, 'leaf').parentId).toBe('sub')
  })

  it('lands a batch contiguously after the decks already in the row', async () => {
    const store = startedDeckStore([
      storedDeck('there', { folderId: 'f1', order: 2 }),
      storedDeck('a', { order: 0 }),
      storedDeck('b', { order: 1 }),
    ])

    const to = { parentId: null, folderId: 'f1' }
    await moveDecks(store, [
      { id: 'a', to },
      { id: 'b', to },
    ])

    expect([heldDeck(store, 'a').order, heldDeck(store, 'b').order]).toEqual([3, 4])
  })

  it('a subdeck moved out keeps studying the way its main deck taught it', async () => {
    const store = startedDeckStore([
      storedDeck('main', {
        settings: { algorithm: 'fast', newCardsPerDay: 3, textToSpeech: true },
      }),
      storedDeck('sub', { parentId: 'main', settings: { studyDirection: 'back' } }),
    ])

    await moveDecks(store, [{ id: 'sub', to: LIBRARY_TOP }])

    expect(heldDeck(store, 'sub').settings).toEqual({
      algorithm: 'fast',
      newCardsPerDay: 3,
      studyDirection: 'back',
    })
  })

  it('a deck moved into another sheds the settings its new main deck owns', async () => {
    const store = startedDeckStore([
      storedDeck('main'),
      storedDeck('other', { order: 1, settings: { algorithm: 'fast', textToSpeech: true } }),
    ])

    await moveDecks(store, [{ id: 'other', to: { parentId: 'main', folderId: null } }])

    expect(heldDeck(store, 'other').settings).toEqual({ textToSpeech: true })
  })

  it('refuses to move a deck into its own subtree', async () => {
    const store = startedDeckStore([storedDeck('main'), storedDeck('sub', { parentId: 'main' })])

    await expect(
      moveDecks(store, [{ id: 'main', to: { parentId: 'sub', folderId: null } }]),
    ).rejects.toThrow('Cannot move a deck into its own subtree')
  })
})
