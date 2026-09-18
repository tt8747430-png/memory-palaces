import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { bibleMessages } from '../i18n/en'
import { storedDeck } from '../testing/decks'
import { renderImportPage } from '../testing/render-import-page'
import { buildVerseCards } from '../model/verse-cards'
import { publishVerses } from '../features/publish-verses'
import { versesFromCards } from '../model/verse-sources'
import { createBibleVerseStore } from '../model/store'
import { BibleLibraryPage } from './BibleLibraryPage'
import { InMemoryRepository } from '@/shared/api'
import { started } from '@/shared/test/started'
import { toast } from 'sonner'
import { type BibleVerse, DEFAULT_TRANSLATION } from '../model/verse'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const verseCard = (id: string, front: string, back: string) =>
  makeCard({ id, createdAt: at, deckId: 'deck-1', front, back })

describe('BibleLibraryPage', () => {
  it('says the library is empty before anything is published', () => {
    renderImportPage(<BibleLibraryPage />)
    expect(screen.getByText('No Bible text published yet')).toBeInTheDocument()
  })

  it('lists each published book with how many verses it holds', () => {
    renderImportPage(<BibleLibraryPage />, {
      verses: versesFromCards(
        [
          { front: 'Genesis 1:1', back: 'First.' },
          { front: 'Genesis 1:2', back: 'Second.' },
        ],
        DEFAULT_TRANSLATION,
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
    const sheet = await screen.findByRole('dialog')
    // The sheet says what picking does — it publishes, it moves nothing.
    expect(within(sheet).getByText('Its verse cards join the Bible library')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Pick a deck' })).toBeDisabled()
    await user.click(within(sheet).getByText('Genesis 1'))
    await user.click(screen.getByRole('button', { name: 'Publish Genesis 1' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(1))
    expect(verseStore.getState().verses[0]?.text).toBe('In the beginning.')
  })

  it('previews what cleaning would change, then reports what it did', async () => {
    const user = userEvent.setup()
    const { cardStore } = renderImportPage(<BibleLibraryPage />, {
      decks: [storedDeck('deck-1', { name: 'Genesis 1' })],
      cards: [
        verseCard('c1', 'Genesis 1:1', 'Genesis 1:1 In the beginning.'),
        verseCard('c2', 'Genesis 1:2', 'The earth.'),
      ],
    })
    await user.click(screen.getByRole('button', { name: /Clean references/ }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('Pick the deck whose backs to clean')).toBeInTheDocument()
    await user.click(within(sheet).getByText('Genesis 1'))
    await user.click(screen.getByRole('button', { name: 'Clean Genesis 1' }))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('1 card would change')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /Clean references/ }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Cleaned 1 card'))
    expect(cardStore.getState().cards.find((card) => card.id === 'c1')?.back).toBe(
      'In the beginning.',
    )
  })
})

describe('keeping the text in the import box', () => {
  it('publishes exactly the verses in the box, reference stripped from each', async () => {
    const store = started(createBibleVerseStore(new InMemoryRepository<BibleVerse>([])))
    const cards = buildVerseCards(
      { book: 'Genesis', chapter: 1, from: 1, to: 2 },
      '1) First. 2) Second.',
    )

    expect(await publishVerses(store, versesFromCards(cards, DEFAULT_TRANSLATION, at))).toBe(2)
    expect(store.getState().verses.map((verse) => verse.text)).toEqual(['First.', 'Second.'])
  })
})
