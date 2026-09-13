import { describe, expect, it } from 'vitest'
import { storedDeck } from './deck-fixtures'
import {
  isAtLibraryTop,
  isSubdeck,
  LIBRARY_TOP,
  placeDecks,
  placeOf,
  standsAt,
  strandedArchivedIds,
} from './placement'
import { withoutFields } from '@/shared/test/legacy-document'

describe('isSubdeck / isAtLibraryTop', () => {
  it('tells a subdeck, a filed deck and a deck at the top apart', () => {
    expect(isSubdeck(storedDeck('a', { parentId: 'p' }))).toBe(true)
    expect(isAtLibraryTop(storedDeck('a'))).toBe(true)
    expect(isAtLibraryTop(storedDeck('a', { folderId: 'f1' }))).toBe(false)
    expect(isAtLibraryTop(storedDeck('a', { parentId: 'p' }))).toBe(false)
  })
})

describe('placeOf', () => {
  it('reads a deck stored before folders as unfiled', () => {
    expect(placeOf(withoutFields(storedDeck('old'), 'folderId'))).toEqual(LIBRARY_TOP)
    expect(placeOf(storedDeck('a', { folderId: 'f1' }))).toEqual({ parentId: null, folderId: 'f1' })
  })
})

describe('standsAt', () => {
  it('matches a deck at the top by its folder', () => {
    const filed = storedDeck('a', { folderId: 'f1' })

    expect(standsAt(filed, { parentId: null, folderId: 'f1' })).toBe(true)
    expect(standsAt(filed, LIBRARY_TOP)).toBe(false)
  })

  it('matches a subdeck by its parent alone', () => {
    const sub = storedDeck('sub', { parentId: 'main' })

    expect(standsAt(sub, { parentId: 'main', folderId: 'f1' })).toBe(true)
    expect(standsAt(sub, { parentId: 'other', folderId: null })).toBe(false)
    expect(standsAt(sub, LIBRARY_TOP)).toBe(false)
  })
})

describe('placeDecks', () => {
  it('lands a batch in one row on consecutive orders after what is already there', () => {
    const decks = [
      storedDeck('there', { order: 3 }),
      storedDeck('a', { folderId: 'f1' }),
      storedDeck('b', { folderId: 'f1' }),
    ]

    const placed = placeDecks(decks, [
      { id: 'a', to: LIBRARY_TOP },
      { id: 'b', to: LIBRARY_TOP },
    ])

    expect(placed.get('a')).toMatchObject({ parentId: null, folderId: null, order: 4 })
    expect(placed.get('b')).toMatchObject({ order: 5 })
  })

  it('counts each row on its own', () => {
    const decks = [storedDeck('a'), storedDeck('b', { order: 1 }), storedDeck('main', { order: 2 })]

    const placed = placeDecks(decks, [
      { id: 'a', to: { parentId: null, folderId: 'f1' } },
      { id: 'b', to: { parentId: 'main', folderId: null } },
    ])

    expect(placed.get('a')).toMatchObject({ folderId: 'f1', order: 0 })
    expect(placed.get('b')).toMatchObject({ parentId: 'main', folderId: null, order: 0 })
  })

  it('a subdeck arriving at the top trades what it stored for what its main deck taught it', () => {
    const decks = [
      storedDeck('main', { settings: { newCardsPerDay: 2 } }),
      storedDeck('sub', {
        parentId: 'main',
        settings: { algorithm: 'fast', studyDirection: 'back' },
      }),
    ]

    const placed = placeDecks(decks, [{ id: 'sub', to: LIBRARY_TOP }])

    expect(placed.get('sub')?.settings).toEqual({ newCardsPerDay: 2, studyDirection: 'back' })
  })

  it('a main deck keeps its own settings wherever it goes', () => {
    const decks = [storedDeck('main', { settings: { algorithm: 'fast' } })]

    const placed = placeDecks(decks, [{ id: 'main', to: { parentId: null, folderId: 'f1' } }])

    expect(placed.get('main')?.settings).toEqual({ algorithm: 'fast' })
  })

  it('skips an id that is not in the library', () => {
    expect(placeDecks([storedDeck('a')], [{ id: 'gone', to: LIBRARY_TOP }]).size).toBe(0)
  })
})

describe('strandedArchivedIds', () => {
  it('finds archived decks still standing where they were archived from', () => {
    const decks = [
      storedDeck('filed', { archived: true, folderId: 'f1' }),
      storedDeck('main'),
      storedDeck('sub', { archived: true, parentId: 'main' }),
      storedDeck('orphan', { archived: true, parentId: 'deleted' }),
      storedDeck('whole', { archived: true }),
      storedDeck('twig', { archived: true, parentId: 'whole' }),
    ]

    expect(strandedArchivedIds(decks)).toEqual(['filed', 'sub', 'orphan'])
  })
})
