import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/shared/i18n'
import { setDevMode } from '@/shared/lib'
import { makeCard } from '@/entities/card'
import { bibleMessages } from '../i18n/en'
import { storedDeck } from '../testing/decks'
import { renderImportPage } from '../testing/render-import-page'
import { buildVerseCards } from '../features/build-verse-cards'
import { publishVerses, versesFromCards } from '../features/publish-source'
import { createBibleVerseStore } from '../model/store'
import { BibleLibraryPage } from './BibleLibraryPage'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import type { BibleVerse } from '../model/verse'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()

beforeEach(() => setDevMode(true))

afterEach(() => {
  cleanup()
  setDevMode(false)
})

const verseCard = (id: string, front: string, back: string) =>
  makeCard({ id, createdAt: at, deckId: 'deck-1', front, back })

describe('BibleLibraryPage', () => {
  it('shows nothing to act on while dev mode is off', () => {
    setDevMode(false)
    renderImportPage(<BibleLibraryPage />)
    expect(screen.queryByRole('button', { name: /Publish a deck/ })).not.toBeInTheDocument()
  })

  it('says the library is empty before anything is published', () => {
    renderImportPage(<BibleLibraryPage />)
    expect(screen.getByText('Nothing to add yet')).toBeInTheDocument()
  })

  it('lists each published book with how many verses it holds', () => {
    renderImportPage(<BibleLibraryPage />, {
      verses: versesFromCards(
        [
          { front: 'Genesis 1:1', back: 'First.' },
          { front: 'Genesis 1:2', back: 'Second.' },
        ],
        at,
      ),
    })
    expect(screen.getByText('Genesis')).toBeInTheDocument()
    expect(screen.getByText('2 verses')).toBeInTheDocument()
  })

  it('publishes the verse cards of a deck and skips the ordinary notes', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleLibraryPage />, {
      decks: [storedDeck('deck-1', { name: 'Genesis 1' })],
      cards: [
        verseCard('c1', 'Genesis 1:1', 'In the beginning.'),
        verseCard('c2', 'Zeus', 'King of the gods'),
      ],
    })
    await user.click(screen.getByRole('button', { name: /Publish a deck/ }))
    await user.click(await screen.findByText('Genesis 1'))
    await user.click(screen.getByRole('button', { name: 'Move to Genesis 1' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(1))
    expect(verseStore.getState().verses[0]?.text).toBe('In the beginning.')
  })
})

describe('keeping the text in the import box', () => {
  it('publishes exactly the verses in the box, reference stripped from each', async () => {
    const store = started(createBibleVerseStore(new InMemoryRepository<BibleVerse>([])))
    const cards = buildVerseCards(
      { book: 'Genesis', chapter: 1, from: 1, to: 2 },
      '1) First. 2) Second.',
    )

    expect(await publishVerses(store, versesFromCards(cards, at))).toBe(2)
    expect(store.getState().verses.map((verse) => verse.text)).toEqual(['First.', 'Second.'])
  })
})
