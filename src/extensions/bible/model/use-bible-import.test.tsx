import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, waitFor } from '@testing-library/react'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { useImportDraft } from '@/widgets/content-editor'
import { bibleMessages } from '../i18n/en'
import { storedDeck } from '../testing/decks'
import { renderImportHook } from '../testing/render-import-page'
import { useBibleImport } from './use-bible-import'
import { makeBibleVerse } from './verse'
import { DEFAULT_TRANSLATION } from './translations'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()
const verse = (chapter: number, number: number, text: string) =>
  makeBibleVerse({
    createdAt: at,
    translation: DEFAULT_TRANSLATION,
    book: 'GEN',
    chapter,
    verse: number,
    text,
  })

const genesis = [verse(1, 1, 'First.'), verse(1, 2, 'Second.'), verse(1, 3, 'Third.')]
const genesisOne = [verse(1, 1, 'First.'), verse(1, 3, 'Third.')]

afterEach(() => {
  cleanup()
  useImportDraft.getState().clear()
})

function render(deckId?: string, harness: Parameters<typeof renderImportHook>[1] = {}) {
  const onReview = vi.fn<(deckId: string) => void>()
  const rendered = renderImportHook(() => useBibleImport(deckId, onReview), harness)
  const pick = (chapter: number, from: number, to: number) =>
    act(() => rendered.result.current.picker.jump({ book: 'GEN', chapter, from, to }))
  return { ...rendered, onReview, pick }
}

describe('useBibleImport — the text box', () => {
  it('prefills one verse per line once the Bible library covers the passage', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    await pick(1, 1, 2)
    expect(result.current.text).toBe('1) First.\n2) Second.')
    expect(result.current.prefilled).toBe(true)
    expect(result.current.passage).toEqual({ text: '1) First.\n2) Second.', held: 2, missing: [] })
  })

  it('leaves a bare marker for a verse it lacks, and names it as missing', async () => {
    const { result, pick } = render(undefined, { verses: genesisOne })
    await pick(1, 1, 3)
    expect(result.current.text).toBe('1) First.\n2) \n3) Third.')
    expect(result.current.missing).toEqual([2])
  })

  it('stops calling a verse missing once the learner types it in', async () => {
    const { result, pick } = render(undefined, { verses: genesisOne })
    await pick(1, 1, 3)
    act(() => result.current.setText('1) First.\n2) Second.\n3) Third.'))
    expect(result.current.missing).toEqual([])
  })

  it('leaves a prefilled box cleared — their own text always wins, including none', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    await pick(1, 1, 2)
    act(() => result.current.setText(''))
    expect(result.current.text).toBe('')
    expect(result.current.prefilled).toBe(false)
  })

  it('prefills again for a new passage — the clearing answered the old one', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    await pick(1, 1, 1)
    act(() => result.current.setText(''))
    await pick(1, 3, 3)
    expect(result.current.text).toBe('3) Third.')
    expect(result.current.prefilled).toBe(true)
  })

  it('carries text the learner typed across a change of passage', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    act(() => result.current.setText('My own paste.'))
    await pick(1, 1, 2)
    expect(result.current.text).toBe('My own paste.')
    expect(result.current.prefilled).toBe(false)
  })

  it('fills an untouched box when the Bible library learns the passage — Sync arrives mid-screen', async () => {
    const { result, pick, verseStore } = render()
    await waitFor(() => expect(result.current.ready).toBe(true))
    await pick(1, 1, 1)
    expect(result.current.text).toBe('')

    await act(() => verseStore.getState().save(verse(1, 1, 'First.')))

    await waitFor(() => expect(result.current.text).toBe('1) First.'))
    expect(result.current.prefilled).toBe(true)
  })

  it('lists the chapters the learner last added from', () => {
    const { result } = render(undefined, {
      cards: [makeCard({ id: 'c1', createdAt: at, deckId: 'd', front: 'Ioan 3:16', back: 'x' })],
    })
    expect(result.current.recents).toEqual([{ book: 'JHN', chapter: 3 }])
  })
})

describe('useBibleImport — splitting', () => {
  it('counts what splitting would produce, not what the toggle currently made', async () => {
    const { result, pick } = render()
    await pick(1, 1, 3)
    act(() => result.current.setText('1) A. 2) B. 3) C.'))
    expect(result.current.splitCount).toBe(3)

    act(() => result.current.set('split', false))

    expect(result.current.addable).toHaveLength(1)
    expect(result.current.splitCount).toBe(3)
  })
})

describe('useBibleImport — the Bible library is read, never written', () => {
  it('adds the cards and leaves the library exactly as it was', async () => {
    const { result, pick, verseStore, onReview } = render(undefined, { verses: genesisOne })
    await pick(1, 1, 3)
    act(() => result.current.setText('1) Pasted over.\n2) Second.\n3) Third.'))

    act(() => result.current.add())

    await waitFor(() => expect(onReview).toHaveBeenCalledTimes(1))
    expect(verseStore.getState().verses.map((held) => [held.verse, held.text])).toEqual([
      [1, 'First.'],
      [3, 'Third.'],
    ])
  })
})

describe('useBibleImport — where the cards go', () => {
  it('opens on the deck the learner came from, with placement off', () => {
    const { result } = render('deck-1', { decks: [storedDeck('deck-1', { name: 'Memory work' })] })
    expect(result.current.auto).toBe(false)
    expect(result.current.destination).toBe('Memory work')
  })

  it('gives back the deck it was opened on when placement is switched on and off again', () => {
    const { result } = render('deck-1', { decks: [storedDeck('deck-1', { name: 'Memory work' })] })
    act(() => result.current.set('auto', true))
    expect(result.current.target).toEqual({ kind: 'automatic' })
    act(() => result.current.set('auto', false))
    expect(result.current.target).toEqual({ kind: 'deck', deckId: 'deck-1' })
  })

  it('names an unnamed new deck after the chapter, and follows the chapter', async () => {
    const { result, pick } = render()
    await pick(1, 1, 1)
    act(() => result.current.set('auto', false))
    expect(result.current.destination).toBe('Geneza 1')

    await pick(2, 1, 1)

    expect(result.current.destination).toBe('Geneza 2')
    expect(result.current.target).toEqual({ kind: 'newDeck', name: 'Geneza 2' })
  })

  it('leaves a deck the learner named alone when the chapter changes', async () => {
    const { result, pick } = render()
    await pick(1, 1, 1)
    act(() => result.current.set('auto', false))
    act(() => result.current.nameDeck('Memory work'))
    await pick(2, 1, 1)
    expect(result.current.destination).toBe('Memory work')
  })

  it('cannot add to a new deck it has no name for — switched off before a book was picked', () => {
    const { result } = render()
    act(() => result.current.setText('(1:1) In the beginning.'))
    expect(result.current.canAdd).toBe(true)
    act(() => result.current.set('auto', false))
    expect(result.current.canAdd).toBe(false)
  })

  it('hands exactly the addable cards to the draft and reports the deck to review in', async () => {
    const { result, pick, onReview, deckStore } = render(undefined, {
      decks: [storedDeck('deck-1')],
      cards: [
        makeCard({ id: 'c1', createdAt: at, deckId: 'deck-1', front: 'Geneza 1:1', back: 'A.' }),
      ],
    })
    await pick(1, 1, 2)
    act(() => result.current.setText('1) A. 2) B.'))
    expect(result.current.duplicates).toEqual([{ front: 'Geneza 1:1', deckId: 'deck-1' }])
    expect(result.current.addable).toEqual([{ front: 'Geneza 1:2', back: 'B.' }])

    act(() => result.current.add())

    await waitFor(() => expect(onReview).toHaveBeenCalledTimes(1))
    const reviewIn = onReview.mock.calls[0]?.[0]
    expect(deckStore.getState().decks.find((deck) => deck.id === reviewIn)?.name).toBe('Geneza 1')
    expect(useImportDraft.getState().draft?.cards).toEqual([
      expect.objectContaining({ front: 'Geneza 1:2', back: 'B.' }),
    ])
  })
})
