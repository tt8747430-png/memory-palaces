import { describe, expect, it, vi } from 'vitest'
import type { ParsedCard } from '@/shared/lib'
import { startedDeckStore, storedDeck } from '../testing/decks'
import { addVerseCards, type AddVerseCardsInput } from './add-verse-cards'

const ref = { book: 'Genesis', chapter: 1, from: 1, to: 2 }
const cards: ParsedCard[] = [
  { front: 'Genesis 1:1', back: 'In the beginning.' },
  { front: 'Genesis 1:2', back: 'The earth.' },
]

function setup(over: Partial<AddVerseCardsInput> = {}) {
  const deckStore = startedDeckStore(over.target?.kind === 'deck' ? [storedDeck('deck-1')] : [])
  const setDraft = vi.fn<(source: 'extension', cards: ParsedCard[]) => void>()
  const input: AddVerseCardsInput = { cards, ref, target: { kind: 'automatic' }, ...over }
  return { deckStore, setDraft, run: () => addVerseCards({ deckStore, setDraft }, input) }
}

describe('addVerseCards', () => {
  it('places automatically into book then chapter', async () => {
    const { deckStore, setDraft, run } = setup()
    const deckId = await run()
    const chapter = deckStore.getState().decks.find((deck) => deck.id === deckId)
    expect(chapter?.name).toBe('Genesis 1')
    expect(setDraft).toHaveBeenCalledWith('extension', cards)
  })

  it('uses the deck the reader chose', async () => {
    const { deckStore, run } = setup({ target: { kind: 'deck', deckId: 'deck-1' } })
    expect(await run()).toBe('deck-1')
    expect(deckStore.getState().decks).toHaveLength(1)
  })

  it('creates the deck the reader named', async () => {
    const { deckStore, run } = setup({ target: { kind: 'newDeck', name: 'Memory work' } })
    const deckId = await run()
    expect(deckStore.getState().decks.find((deck) => deck.id === deckId)?.name).toBe('Memory work')
  })

  it('falls back to a plain new deck when a marked-up paste has no book', async () => {
    const { deckStore, run } = setup({
      ref: null,
      cards: [{ front: '1:1', back: 'The elder, to Gaius' }],
    })
    const deckId = await run()
    expect(deckStore.getState().decks.find((deck) => deck.id === deckId)?.name).toBe('1:1')
  })

  it('refuses an unnamed new deck, and an empty hand-off', async () => {
    await expect(setup({ target: { kind: 'newDeck', name: '' } }).run()).rejects.toThrow()
    await expect(setup({ cards: [] }).run()).rejects.toThrow()
  })
})
