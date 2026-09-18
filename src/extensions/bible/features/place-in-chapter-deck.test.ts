import { describe, expect, it } from 'vitest'
import { startedDeckStore, storedDeck } from '../testing/decks'
import { ensureChapterDeck } from './place-in-chapter-deck'

const deckNames = (store: ReturnType<typeof startedDeckStore>) =>
  store.getState().decks.map((deck) => deck.name)

describe('ensureChapterDeck', () => {
  it('creates the book deck and the chapter subdeck when neither exists', async () => {
    const store = startedDeckStore([])
    const deckId = await ensureChapterDeck(store, 'GEN', 1)
    expect(deckNames(store).sort()).toEqual(['Geneza', 'Geneza 1'])
    const chapter = store.getState().decks.find((deck) => deck.id === deckId)
    const book = store.getState().decks.find((deck) => deck.name === 'Geneza')
    expect(chapter?.name).toBe('Geneza 1')
    expect(chapter?.parentId).toBe(book?.id)
  })

  it('reuses a book deck that already exists', async () => {
    const store = startedDeckStore([storedDeck('genesis', { name: 'Geneza' })])
    await ensureChapterDeck(store, 'GEN', 1)
    expect(deckNames(store).filter((name) => name === 'Geneza')).toHaveLength(1)
  })

  it('reuses a book deck filed inside a folder, where it sits', async () => {
    const store = startedDeckStore([
      storedDeck('genesis', { name: 'Geneza', folderId: 'folder-1' }),
    ])
    const deckId = await ensureChapterDeck(store, 'GEN', 1)
    const chapter = store.getState().decks.find((deck) => deck.id === deckId)
    expect(chapter?.parentId).toBe('genesis')
    expect(deckNames(store).filter((name) => name === 'Geneza')).toHaveLength(1)
  })

  it('reuses the chapter subdeck, so a second import joins the first', async () => {
    const store = startedDeckStore([
      storedDeck('genesis', { name: 'Geneza' }),
      storedDeck('genesis-1', { name: 'Geneza 1', parentId: 'genesis' }),
    ])
    expect(await ensureChapterDeck(store, 'GEN', 1)).toBe('genesis-1')
    expect(store.getState().decks).toHaveLength(2)
  })

  it('finds the book deck under any of its names', async () => {
    const store = startedDeckStore([storedDeck('cor', { name: '1 Cor' })])
    const deckId = await ensureChapterDeck(store, '1CO', 8)
    expect(store.getState().decks.find((deck) => deck.id === deckId)?.parentId).toBe('cor')
  })

  it('ignores an archived deck of the same name — the archive is a place outside the library', async () => {
    const store = startedDeckStore([storedDeck('genesis', { name: 'Geneza', archived: true })])
    await ensureChapterDeck(store, 'GEN', 1)
    expect(deckNames(store).filter((name) => name === 'Geneza')).toHaveLength(2)
  })
})
