import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { isExtensionFeatureOn, isExtensionEnabled } from '@/entities/preferences'
import { bibleMessages } from '../i18n/en'
import { storedDeck } from '../testing/decks'
import { renderImportPage } from '../testing/render-import-page'
import { makeBibleVerse } from '../model/verse'
import { BibleOverviewPage } from './BibleOverviewPage'

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

describe('BibleOverviewPage', () => {
  it('says what the extension is, what it provides and what its library holds', () => {
    renderImportPage(<BibleOverviewPage />, { verses: [verse(3, 16), verse(3, 17)] })

    expect(
      screen.getByText(/a passage importer with a verse library of its own/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Passage import' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Verse library' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Chapter decks' })).toBeChecked()
    expect(screen.getByText('2 verses · 1 books')).toBeInTheDocument()
  })

  it('switches one feature off without touching the extension or the others', async () => {
    const user = userEvent.setup()
    const { preferencesStore } = renderImportPage(<BibleOverviewPage />)

    await user.click(screen.getByRole('switch', { name: 'Chapter decks' }))

    await waitFor(() => {
      const stored = preferencesStore.getState().preferences!
      expect(isExtensionFeatureOn(stored, 'bible', 'chapterDecks')).toBe(false)
      expect(isExtensionFeatureOn(stored, 'bible', 'import')).toBe(true)
      expect(isExtensionEnabled(stored, 'bible')).toBe(true)
    })
  })

  it('stops offering the library tools when the verse library is switched off', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleOverviewPage />)
    expect(screen.getByRole('button', { name: /Add text from your cards/ })).toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Verse library' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Add text from your cards/ })).toBeNull(),
    )
    expect(screen.getByText(/the verse library is switched off/i)).toBeInTheDocument()
  })

  it('previews adding text from every card, then adds only what is new', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleOverviewPage />, {
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
    const { verseStore } = renderImportPage(<BibleOverviewPage />, {
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
    renderImportPage(<BibleOverviewPage />, {
      verses: [verse(3, 16)],
      decks: [storedDeck('deck-1')],
      cards: [verseCard('c1', 'Ioan 3:16', 'x')],
    })
    await user.click(screen.getByRole('button', { name: /Add text from your cards/ }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    // Named, not counted: the message says which verse it already has.
    expect(toast).toHaveBeenCalledWith('Nothing new — Ioan 3:16 is already in your Bible library.')
  })

  it('offers the developer tools only in dev mode', () => {
    renderImportPage(<BibleOverviewPage />)
    expect(screen.queryByRole('button', { name: /Bible developer tools/ })).toBeNull()

    cleanup()
    renderImportPage(<BibleOverviewPage />, { devMode: true })
    expect(screen.getByRole('button', { name: /Bible developer tools/ })).toBeInTheDocument()
  })

  it('switches the whole extension off from its own page', async () => {
    const user = userEvent.setup()
    const onSwitchedOff = vi.fn()
    const { preferencesStore } = renderImportPage(
      <BibleOverviewPage onSwitchedOff={onSwitchedOff} />,
    )

    await user.click(screen.getByRole('button', { name: /Switch off Bible/ }))

    await waitFor(() =>
      expect(isExtensionEnabled(preferencesStore.getState().preferences!, 'bible')).toBe(false),
    )
    expect(onSwitchedOff).toHaveBeenCalled()
  })
})
