import { describe, expect, it } from 'vitest'
import { startedDeckStore, storedDeck } from '../testing/decks'
import { ensureChapterDeck } from './place-in-chapter-deck'

const deckNames = (store: ReturnType<typeof startedDeckStore>) =>
  store.getState().decks.map((deck) => deck.name)

describe('ensureChapterDeck', () => {
  it('creates the book deck and the chapter subdeck when neither exists', async () => {
    const store = startedDeckStore([])
    const deckId = await ensureChapterDeck(store, 'Genesis', 1)
    expect(deckNames(store).sort()).toEqual(['Genesis', 'Genesis 1'])
    const chapter = store.getState().decks.find((deck) => deck.id === deckId)
    const book = store.getState().decks.find((deck) => deck.name === 'Genesis')
    expect(chapter?.name).toBe('Genesis 1')
    expect(chapter?.parentId).toBe(book?.id)
  })

  it('reuses a book deck that already exists', async () => {
    const store = startedDeckStore([storedDeck('genesis', { name: 'Genesis' })])
    await ensureChapterDeck(store, 'Genesis', 1)
    expect(deckNames(store).filter((name) => name === 'Genesis')).toHaveLength(1)
  })

  it('reuses a book deck filed inside a folder, where it sits', async () => {
    const store = startedDeckStore([
      storedDeck('genesis', { name: 'Genesis', folderId: 'folder-1' }),
    ])
    const deckId = await ensureChapterDeck(store, 'Genesis', 1)
    const chapter = store.getState().decks.find((deck) => deck.id === deckId)
    expect(chapter?.parentId).toBe('genesis')
    expect(deckNames(store).filter((name) => name === 'Genesis')).toHaveLength(1)
  })

  it('reuses the chapter subdeck, so a second import joins the first', async () => {
    const store = startedDeckStore([
      storedDeck('genesis', { name: 'Genesis' }),
      storedDeck('genesis-1', { name: 'Genesis 1', parentId: 'genesis' }),
    ])
    expect(await ensureChapterDeck(store, 'Genesis', 1)).toBe('genesis-1')
    expect(store.getState().decks).toHaveLength(2)
  })

  it('ignores an archived deck of the same name — the archive is a place outside the library', async () => {
    const store = startedDeckStore([storedDeck('genesis', { name: 'Genesis', archived: true })])
    await ensureChapterDeck(store, 'Genesis', 1)
    expect(deckNames(store).filter((name) => name === 'Genesis')).toHaveLength(2)
  })
})
