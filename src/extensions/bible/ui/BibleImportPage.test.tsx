import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { bibleMessages } from '../i18n/en'
import { renderImportPage } from '../testing/render-import-page'
import { storedDeck } from '../testing/decks'
import { makeBibleVerse } from '../model/verse'
import { useImportDraft } from '@/widgets/content-editor'
import { BibleImportPage } from './BibleImportPage'

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()

afterEach(() => {
  cleanup()
  useImportDraft.getState().clear()
})

const pickGenesis11 = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Genesis' }))
  await user.click(screen.getByRole('button', { name: '1' }))
  await user.click(screen.getByRole('button', { name: '1' }))
  await user.click(screen.getByRole('button', { name: 'Just verse 1' }))
}

describe('BibleImportPage picker', () => {
  it('starts by asking for a book', () => {
    renderImportPage(<BibleImportPage />)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
  })

  it('walks to the chapter grid, then the verse grids', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    expect(screen.getByText('Pick a chapter')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByText('Pick a starting verse')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1' }))
    expect(screen.getByText('Pick an ending verse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Just verse 1' })).toBeInTheDocument()
  })

  it('shows the reference as it is built', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '31' }))
    expect(screen.getByText('Genesis 1:1-31')).toBeInTheDocument()
  })

  it('keeps the text box on screen before anything is picked', () => {
    renderImportPage(<BibleImportPage />)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
    expect(screen.getByLabelText('Verse text')).toBeInTheDocument()
  })

  it('start over returns to the book list', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
  })
})

describe('BibleImportPage text and target', () => {
  it('opens the text box empty when the library holds nothing, and says so', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    expect(screen.getByLabelText('Verse text')).toHaveValue('')
    expect(
      screen.getByText('This passage is not in your Bible library yet — paste it in below.'),
    ).toBeInTheDocument()
  })

  it('prefills with markers from the library, and says where the text came from', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, {
      verses: [
        makeBibleVerse({ createdAt: at, book: 'Genesis', chapter: 1, verse: 1, text: 'First.' }),
        makeBibleVerse({ createdAt: at, book: 'Genesis', chapter: 1, verse: 2, text: 'Second.' }),
      ],
    })
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText('Text brought in from your Bible library.')).toBeInTheDocument()
    expect(screen.getByLabelText('Verse text')).toHaveValue('1) First. 2) Second.')
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })

  it('counts the cards it would add as the text is typed', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('1) In the beginning. 2) The earth was without form.')
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })

  it('pastes without picking a book — the box needs no separate mode', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) The elder, to Gaius\n(1:2) Beloved, I pray')
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })

  it('places the cards automatically, book then chapter, when the toggle is on', async () => {
    const user = userEvent.setup()
    const onReview = vi.fn()
    const { deckStore } = renderImportPage(<BibleImportPage onReview={onReview} />)
    await pickGenesis11(user)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    await user.click(screen.getByRole('button', { name: 'Add 1 card' }))
    expect(
      deckStore
        .getState()
        .decks.map((deck) => deck.name)
        .sort(),
    ).toEqual(['Genesis', 'Genesis 1'])
    expect(onReview).toHaveBeenCalled()
    expect(useImportDraft.getState().draft?.source).toBe('extension')
  })

  it('asks where the cards go when the toggle is off', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('switch', { name: 'Include in decks' }))
    expect(screen.getByRole('button', { name: 'Choose a deck' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create a deck' })).toBeInTheDocument()
  })

  it('opens on the deck the reader came from, with placement off', () => {
    renderImportPage(<BibleImportPage deckId="deck-1" />, {
      decks: [storedDeck('deck-1', { name: 'Memory work' })],
    })
    expect(screen.getByRole('switch', { name: 'Include in decks' })).not.toBeChecked()
    expect(screen.getByText('Memory work')).toBeInTheDocument()
  })

  it('says which verses are already held and can add them anyway', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, {
      decks: [storedDeck('deck-1')],
      cards: [
        makeCard({
          id: 'c1',
          createdAt: at,
          deckId: 'deck-1',
          front: 'Genesis 1:1',
          back: 'In the beginning.',
        }),
      ],
    })
    await pickGenesis11(user)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    expect(screen.getByText('You already have Genesis 1:1 in your library')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Add/ })).toBeDisabled()
    await user.click(screen.getByRole('switch', { name: 'Skipped. Add them anyway?' }))
    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeEnabled()
  })

  it('cannot add while the text box is empty', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    expect(screen.getByRole('button', { name: /^Add/ })).toBeDisabled()
  })
})
