import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/shared/i18n'
import { bibleMessages } from '../i18n/en'
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

describe('BibleDeveloperPage', () => {
  it('names the translation and says the library is empty before anything is added', () => {
    renderImportPage(<BibleDeveloperPage />, { devMode: true })
    expect(screen.getByText('Biblia Dumitru Cornilescu 2024')).toBeInTheDocument()
    expect(
      screen.getByText('No Bible text yet. Add a passage, or add text from your cards.'),
    ).toBeInTheDocument()
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

  it('answers for itself when Developer mode is off, however the learner got here', () => {
    renderImportPage(<BibleDeveloperPage />, { verses: [verse(3, 16)] })
    expect(screen.getByText(/these tools need developer mode/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Forget Ioan' })).not.toBeInTheDocument()
  })
})
