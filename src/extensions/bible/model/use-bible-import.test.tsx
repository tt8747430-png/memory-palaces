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

afterEach(() => {
  cleanup()
  useImportDraft.getState().clear()
})

function render(deckId?: string, harness: Parameters<typeof renderImportHook>[1] = {}) {
  const onReview = vi.fn<(deckId: string) => void>()
  const rendered = renderImportHook(() => useBibleImport(deckId, onReview), harness)
  const pick = (chapter: number, from: number, to: number) =>
    act(() => {
      rendered.result.current.picker.pickBook('GEN')
      rendered.result.current.picker.pickChapter(chapter)
      rendered.result.current.picker.pickFrom(from)
      rendered.result.current.picker.pickTo(to)
    })
  return { ...rendered, onReview, pick }
}

describe('useBibleImport — the text box', () => {
  it('prefills with markers once the Bible library covers the passage', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    await pick(1, 1, 2)
    await waitFor(() => expect(result.current.text).toBe('1) First. 2) Second.'))
    expect(result.current.prefilled).toBe(true)
  })

  it('leaves a prefilled box cleared — their own text always wins, including none', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    await pick(1, 1, 2)
    await waitFor(() => expect(result.current.prefilled).toBe(true))

    act(() => result.current.setText(''))

    expect(result.current.text).toBe('')
    expect(result.current.prefilled).toBe(false)
  })

  it('prefills again for a new passage — the clearing answered the old one', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    await pick(1, 1, 1)
    await waitFor(() => expect(result.current.text).toBe('1) First.'))
    act(() => result.current.setText(''))

    act(() => result.current.picker.changeVerses())
    await pick(1, 3, 3)

    await waitFor(() => expect(result.current.text).toBe('3) Third.'))
    expect(result.current.prefilled).toBe(true)
  })

  it('carries text the learner typed across a change of passage', async () => {
    const { result, pick } = render(undefined, { verses: genesis })
    act(() => result.current.setText('My own paste.'))
    await pick(1, 1, 2)
    expect(result.current.text).toBe('My own paste.')
    expect(result.current.prefilled).toBe(false)
  })

  it('fills an untouched box when the Bible library learns the passage — sync arrives mid-screen', async () => {
    const { result, pick, verseStore } = render()
    await pick(1, 1, 1)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.text).toBe('')

    await act(() => verseStore.getState().save(verse(1, 1, 'First.')))

    await waitFor(() => expect(result.current.text).toBe('1) First.'))
    expect(result.current.prefilled).toBe(true)
  })
})

describe('useBibleImport — splitting and keeping', () => {
  it('counts what splitting would produce, not what the toggle currently made', async () => {
    const { result, pick } = render()
    await pick(1, 1, 3)
    act(() => result.current.setText('1) A. 2) B. 3) C.'))
    expect(result.current.splitCount).toBe(3)

    act(() => result.current.set('split', false))

    expect(result.current.addable).toHaveLength(1)
    expect(result.current.splitCount).toBe(3)
  })

  it('keeps every verse even with splitting off — the Bible library stores one record per verse', async () => {
    const { result, pick, verseStore } = render(undefined, { devMode: true })
    await pick(1, 1, 3)
    act(() => result.current.setText('1) A. 2) B. 3) C.'))
    act(() => result.current.set('split', false))
    expect(result.current.keepOffered).toBe(true)

    act(() => result.current.keep())

    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(3))
  })

  it('offers no Keep for text that names no single verse', async () => {
    const { result, pick } = render(undefined, { devMode: true })
    await pick(1, 1, 3)
    // Unmarked text over a range is one card fronted `Genesis 1:1-3` — not a verse record.
    act(() => result.current.setText('In the beginning God created the heaven and the earth.'))
    expect(result.current.addable).toHaveLength(1)
    expect(result.current.keepOffered).toBe(false)
  })
})

describe('useBibleImport — which books the picker offers', () => {
  it('offers the books the Bible library holds text for, from the first render', () => {
    const { result } = render(undefined, { verses: genesis })
    expect(result.current.isBookPickable('GEN')).toBe(true)
    expect(result.current.isBookPickable('EXO')).toBe(false)
  })

  it('offers every book in dev mode — a book with no text is picked to publish its text', () => {
    const { result } = render(undefined, { verses: genesis, devMode: true })
    expect(result.current.isBookPickable('EXO')).toBe(true)
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

    act(() => result.current.picker.startOver())
    await pick(2, 1, 1)

    expect(result.current.destination).toBe('Geneza 2')
    expect(result.current.target).toEqual({ kind: 'newDeck', name: 'Geneza 2' })
  })

  it('leaves a deck the learner named alone when the chapter changes', async () => {
    const { result, pick } = render()
    await pick(1, 1, 1)
    act(() => result.current.set('auto', false))
    act(() => result.current.nameDeck('Memory work'))
    act(() => result.current.picker.startOver())
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
