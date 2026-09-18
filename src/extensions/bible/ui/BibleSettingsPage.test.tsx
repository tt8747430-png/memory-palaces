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
import { BibleSettingsPage } from './BibleSettingsPage'

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

describe('BibleSettingsPage', () => {
  it('names the translation and says the library is empty before anything is added', () => {
    renderImportPage(<BibleSettingsPage />)
    expect(screen.getByText('Biblia Dumitru Cornilescu 2024')).toBeInTheDocument()
    expect(
      screen.getByText('No Bible text yet. Add a passage, or add text from your cards.'),
    ).toBeInTheDocument()
  })

  it('lists each held book with its coverage, and folds the rest away', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleSettingsPage />, { verses: [verse(3, 16), verse(3, 17), verse(14, 1)] })
    expect(screen.getByText('Ioan')).toBeInTheDocument()
    expect(screen.getByText('2 of 21 chapters · 3 verses')).toBeInTheDocument()
    expect(screen.queryByText('Geneza')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show 65 books without text' }))
    expect(screen.getByText('Geneza')).toBeInTheDocument()
  })

  it('previews adding text from every card, then adds only what is new', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleSettingsPage />, {
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

  it('adds text from one deck, picked in words that say what picking does', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleSettingsPage />, {
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
    renderImportPage(<BibleSettingsPage />, {
      verses: [verse(3, 16)],
      decks: [storedDeck('deck-1')],
      cards: [verseCard('c1', 'Ioan 3:16', 'x')],
    })
    await user.click(screen.getByRole('button', { name: /Add text from your cards/ }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(toast).toHaveBeenCalledWith(
      'Nothing new — its 1 verse is already in your Bible library.',
    )
  })

  it('offers Forget only in dev mode, and asks before forgetting', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleSettingsPage />, {
      verses: [verse(3, 16)],
      devMode: true,
    })
    await user.click(screen.getByRole('button', { name: 'Forget Ioan' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Forget Ioan?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Forget' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(0))
  })

  it('shows no Forget outside dev mode', () => {
    renderImportPage(<BibleSettingsPage />, { verses: [verse(3, 16)] })
    expect(screen.queryByRole('button', { name: 'Forget Ioan' })).not.toBeInTheDocument()
  })
})
