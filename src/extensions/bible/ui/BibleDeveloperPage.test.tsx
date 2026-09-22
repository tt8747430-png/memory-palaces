import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { bibleMessages } from '../i18n/en'
import { storedDeck } from '../testing/decks'
import { renderImportPage } from '../testing/render-import-page'
import { makeBibleVerse } from '../model/verse'
import { BibleDeveloperPage } from './BibleDeveloperPage'

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }))

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const verse = (chapter: number, number: number, text = 'held') =>
  makeBibleVerse({
    createdAt: at,
    translation: 'cornilescu-2024',
    book: 'JHN',
    chapter,
    verse: number,
    text,
  })

const verseCard = (id: string, front: string, back: string, deckId = 'deck-1') =>
  makeCard({ id, createdAt: at, deckId, front, back })

describe('BibleDeveloperPage', () => {
  it('names the translation and says the library is empty before anything is added', () => {
    renderImportPage(<BibleDeveloperPage />, { devMode: true })
    expect(screen.getByText('Biblia Dumitru Cornilescu 2024')).toBeInTheDocument()
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(
      screen.getByText('No Bible text yet. Add text from your cards to publish it.'),
    ).toBeInTheDocument()
  })

  it('counts what the library holds, and shelves the books without a frame of its own', () => {
    renderImportPage(<BibleDeveloperPage />, {
      verses: [verse(3, 16), verse(3, 17)],
      devMode: true,
    })
    expect(screen.getByText('2 verses · 1 books')).toBeInTheDocument()
    expect(screen.queryByText('Text saved, by book')).toBeNull()
    expect(screen.getByRole('heading', { name: 'New Testament' })).toBeInTheDocument()
  })

  it('lists each held book with its coverage, and folds the rest away', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleDeveloperPage />, {
      verses: [verse(3, 16), verse(3, 17), verse(14, 1)],
      devMode: true,
    })
    expect(screen.getByText('Ioan')).toBeInTheDocument()
    expect(screen.getByText('2 of 21 chapters · 3 verses')).toBeInTheDocument()
    expect(screen.queryByText('Geneza')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show 65 books without text' }))
    expect(screen.getByText('Geneza')).toBeInTheDocument()
  })

  it('asks before forgetting a book', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleDeveloperPage />, {
      verses: [verse(3, 16)],
      devMode: true,
    })
    await user.click(screen.getByRole('button', { name: 'Forget Ioan' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Forget Ioan?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Forget' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(0))
  })

  it('previews publishing text from every card, then publishes only what is new', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleDeveloperPage />, {
      devMode: true,
      verses: [verse(3, 16)],
      decks: [storedDeck('deck-1')],
      cards: [
        verseCard('c1', 'Ioan 3:16', 'pasted over'),
        verseCard('c2', 'Ioan 3:17', 'new'),
        verseCard('c3', 'Zeus', 'a note'),
      ],
    })
    await user.click(screen.getByRole('button', { name: /Add text from your cards/ }))
    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByText(
        '1 new verses from 2 cards. 1 already in your Bible library are kept as they are.',
      ),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Add 1 verse' }))

    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(2))
    expect(verseStore.getState().verses.map((held) => held.text)).toEqual(['held', 'new'])
    expect(toast.success).toHaveBeenCalledWith('Kept 1 verse in your Bible library')
  })

  it('publishes text from one deck, picked in words that say what picking does', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleDeveloperPage />, {
      devMode: true,
      decks: [storedDeck('deck-1', { name: 'Ioan' }), storedDeck('deck-2', { name: 'Other' })],
      cards: [verseCard('c1', 'Ioan 3:17', 'new'), verseCard('c2', 'Ioan 3:18', 'other', 'deck-2')],
    })
    await user.click(screen.getByRole('button', { name: /Add text from one deck/ }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByText('Ioan'))
    await user.click(within(sheet).getByRole('button', { name: 'Add from Ioan' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Add 1 verse' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(1))
    expect(verseStore.getState().verses[0]?.verse).toBe(17)
  })

  it('says so when there is nothing new, without asking', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleDeveloperPage />, {
      devMode: true,
      verses: [verse(3, 16)],
      decks: [storedDeck('deck-1')],
      cards: [verseCard('c1', 'Ioan 3:16', 'x')],
    })
    await user.click(screen.getByRole('button', { name: /Add text from your cards/ }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(toast).toHaveBeenCalledWith('Nothing new — Ioan 3:16 is already in your Bible library.')
  })

  it('answers for itself when Developer mode is off, however the learner got here', () => {
    renderImportPage(<BibleDeveloperPage />, { verses: [verse(3, 16)] })
    expect(screen.getByText(/these tools need developer mode/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Forget Ioan' })).not.toBeInTheDocument()
  })
})
