import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('says what the extension is and what it provides — the library itself is a developer matter', () => {
    renderImportPage(<BibleOverviewPage />, { verses: [verse(3, 16), verse(3, 17)] })

    expect(
      screen.getByText(/a passage importer with a verse library of its own/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Passage import' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Verse library' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Chapter decks' })).toBeChecked()
    expect(screen.queryByText('2 verses · 1 books')).toBeNull()
    expect(screen.queryByText('Bible library')).toBeNull()
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

  it('offers no way to fill the library — that is a developer tool', () => {
    renderImportPage(<BibleOverviewPage />, {
      verses: [verse(3, 16)],
      decks: [storedDeck('deck-1')],
      cards: [verseCard('c1', 'Ioan 3:17', 'new')],
    })
    expect(screen.queryByRole('button', { name: /Add text from your cards/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Add text from one deck/ })).toBeNull()
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
