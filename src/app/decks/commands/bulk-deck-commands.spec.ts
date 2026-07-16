import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@app/shared/data'
import { makeDeck } from '@app/decks/model/deck'
import type { Deck } from '@app/decks/model/deck'
import type { Card } from '@app/decks/model/card'
import type { Folder } from '@app/decks/model/folder'
import { makeFolder } from '@app/decks/model/folder'
import { makeCard } from '@app/decks/model/card'
import { CardStore, DeckStore, FolderStore } from '@app/decks/data/stores'
import { setDecksArchived } from './set-decks-archived'
import { setDecksFavorite } from './set-decks-favorite'
import { moveDecks } from './move-decks'
import { deleteDecks } from './delete-decks'
import { deleteFolders } from './delete-folders'

const at = (n: number) => new Date(n).toISOString()

const deck = (id: string, over: Partial<Deck> = {}): Deck => ({
  ...makeDeck({ id, createdAt: at(0), name: id }),
  ...over,
})

const folder = (id: string): Folder =>
  makeFolder({ id, createdAt: at(0), name: id, color: 'from-sky-500 to-blue-600', icon: '📁' })

function deckStore(seed: Deck[] = []) {
  const store = new DeckStore(new InMemoryRepository<Deck>(seed))
  store.start()
  return store
}

function cardStore(seed: Card[] = []) {
  const store = new CardStore(new InMemoryRepository<Card>(seed))
  store.start()
  return store
}

function folderStore(seed: Folder[] = []) {
  const store = new FolderStore(new InMemoryRepository<Folder>(seed))
  store.start()
  return store
}

const byId = (store: DeckStore, id: string) => store.decks().find((d) => d.id === id)

describe('setDecksArchived', () => {
  it('archives every selected deck', async () => {
    const store = deckStore([deck('a'), deck('b'), deck('c')])

    await setDecksArchived(store, ['a', 'b'], true)

    expect(byId(store, 'a')?.archived).toBe(true)
    expect(byId(store, 'b')?.archived).toBe(true)
    expect(byId(store, 'c')?.archived).toBe(false)
  })

  // Subdecks travel with their parent, or they'd be visible in neither the
  // library nor the archive.
  it('archives the whole subtree of a selected deck', async () => {
    const store = deckStore([deck('parent'), deck('child', { parentId: 'parent' })])

    await setDecksArchived(store, ['parent'], true)

    expect(byId(store, 'child')?.archived).toBe(true)
  })

  it('restores as well as archives', async () => {
    const store = deckStore([deck('a', { archived: true })])

    await setDecksArchived(store, ['a'], false)

    expect(byId(store, 'a')?.archived).toBe(false)
  })

  // A parent and its child both selected must not write the child twice.
  it('unions overlapping subtrees', async () => {
    const store = deckStore([deck('parent'), deck('child', { parentId: 'parent' })])

    await setDecksArchived(store, ['parent', 'child'], true)

    expect(store.decks().every((d) => d.archived)).toBe(true)
  })
})

describe('setDecksFavorite', () => {
  // Favourite is a set, not a flip — the whole point of the rule.
  it('favourites everything when the selection is mixed', async () => {
    const store = deckStore([deck('a', { favorite: true }), deck('b', { favorite: false })])

    const applied = await setDecksFavorite(store, ['a', 'b'])

    expect(applied).toBe(true)
    expect(byId(store, 'a')?.favorite).toBe(true)
    expect(byId(store, 'b')?.favorite).toBe(true)
  })

  it('clears only when every selected deck is already favourited', async () => {
    const store = deckStore([deck('a', { favorite: true }), deck('b', { favorite: true })])

    const applied = await setDecksFavorite(store, ['a', 'b'])

    expect(applied).toBe(false)
    expect(byId(store, 'a')?.favorite).toBe(false)
    expect(byId(store, 'b')?.favorite).toBe(false)
  })

  it('leaves unselected decks alone', async () => {
    const store = deckStore([deck('a', { favorite: false }), deck('b', { favorite: true })])

    await setDecksFavorite(store, ['a'])

    expect(byId(store, 'b')?.favorite).toBe(true)
  })
})

describe('moveDecks', () => {
  it('moves a selection into a folder', async () => {
    const store = deckStore([deck('a'), deck('b')])

    const moved = await moveDecks(store, ['a', 'b'], null, 'f1')

    expect(moved).toEqual(['a', 'b'])
    expect(byId(store, 'a')?.folderId).toBe('f1')
    expect(byId(store, 'b')?.folderId).toBe('f1')
  })

  // "Unfile" is this command, not a separate one.
  it('moves a selection back to the root when both targets are null', async () => {
    const store = deckStore([
      deck('a', { folderId: 'f1' }),
      deck('b', { parentId: 'p' }),
      deck('p'),
    ])

    await moveDecks(store, ['a', 'b'], null, null)

    expect(byId(store, 'a')?.folderId).toBeNull()
    expect(byId(store, 'b')?.parentId).toBeNull()
  })

  // A deck cannot move into its own subtree; a bulk move skips it rather than
  // throwing and abandoning the rest of the selection.
  it('skips decks that cannot be reparented and reports what moved', async () => {
    const store = deckStore([deck('parent'), deck('child', { parentId: 'parent' }), deck('other')])

    const moved = await moveDecks(store, ['parent', 'other'], 'child')

    expect(moved).toEqual(['other'])
    expect(byId(store, 'parent')?.parentId).toBeNull()
    expect(byId(store, 'other')?.parentId).toBe('child')
  })
})

describe('deleteDecks', () => {
  it('deletes each selected deck with its subtree and cards', async () => {
    const decks = deckStore([deck('parent'), deck('child', { parentId: 'parent' }), deck('keep')])
    const cards = cardStore([
      makeCard({ id: 'c1', createdAt: at(0), deckId: 'child', front: 'f', back: 'b' }),
      makeCard({ id: 'c2', createdAt: at(0), deckId: 'keep', front: 'f', back: 'b' }),
    ])

    await deleteDecks(decks, cards, ['parent'])

    expect(decks.decks().map((d) => d.id)).toEqual(['keep'])
    expect(cards.cards().map((c) => c.id)).toEqual(['c2'])
  })

  it('handles a parent and its child both being selected', async () => {
    const decks = deckStore([deck('parent'), deck('child', { parentId: 'parent' })])
    const cards = cardStore()

    await deleteDecks(decks, cards, ['parent', 'child'])

    expect(decks.decks()).toEqual([])
  })
})

describe('deleteFolders', () => {
  // A folder is a shelf, not an owner: its decks are unfiled, never deleted.
  it('deletes the folders and unfiles their decks', async () => {
    const folders = folderStore([folder('f1'), folder('f2')])
    const decks = deckStore([deck('a', { folderId: 'f1' }), deck('b', { folderId: 'f2' })])

    await deleteFolders(folders, decks, ['f1', 'f2'])

    expect(folders.folders()).toEqual([])
    expect(byId(decks, 'a')?.folderId).toBeNull()
    expect(byId(decks, 'b')?.folderId).toBeNull()
  })
})
