import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { bibleMessages } from '../i18n/en'
import { renderImportPage } from '../testing/render-import-page'
import { storedDeck } from '../testing/decks'
import { DEFAULT_TRANSLATION, makeBibleVerse } from '../model/verse'
import { useImportDraft } from '@/widgets/content-editor'
import { BibleImportPage } from './BibleImportPage'

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()
const verse = (number: number, text: string) =>
  makeBibleVerse({
    createdAt: at,
    translation: DEFAULT_TRANSLATION,
    book: 'Genesis',
    chapter: 1,
    verse: number,
    text,
  })
/** Genesis has text *somewhere*, so the picker offers it; chapter 1 stays unheld. */
const genesisCovered = { verses: [makeBibleVerse({ ...verse(1, 'Elsewhere.'), chapter: 2 })] }

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

  it('disables the books the Bible library has no text for, and says why', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, genesisCovered)
    expect(screen.getByText('Books without saved text are greyed out')).toBeInTheDocument()
    const exodus = screen.getByRole('button', { name: 'Exodus' })
    expect(exodus).toBeDisabled()
    await user.click(exodus)
    expect(screen.getByText('Pick a Bible book')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Genesis' })).toBeEnabled()
  })

  it('offers every book while the Bible library holds no text — pasting is the way in', () => {
    renderImportPage(<BibleImportPage />)
    expect(screen.getByRole('button', { name: 'Exodus' })).toBeEnabled()
    expect(screen.queryByText('Books without saved text are greyed out')).not.toBeInTheDocument()
  })

  it('lets dev mode pick a book with no text — that is how its text gets published', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, { ...genesisCovered, devMode: true })
    await user.click(screen.getByRole('button', { name: 'Exodus' }))
    expect(screen.getByText('Pick a chapter')).toBeInTheDocument()
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
  it('opens the text box empty when the Bible library holds nothing, and says so', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    expect(screen.getByLabelText('Verse text')).toHaveValue('')
    expect(
      screen.getByText('No saved text for this passage yet — paste it in below.'),
    ).toBeInTheDocument()
  })

  it('prefills with markers from the Bible library, and says where the text came from', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, {
      verses: [verse(1, 'First.'), verse(2, 'Second.')],
    })
    await user.click(screen.getByRole('button', { name: 'Genesis' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText('Filled in from the saved Bible text.')).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: 'New deck' })).toBeInTheDocument()
  })

  it('picks a deck in words that say what picking does — nothing is moved or added yet', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, {
      decks: [storedDeck('deck-1', { name: 'Memory work' })],
    })
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) In the beginning.')
    await user.click(screen.getByRole('switch', { name: 'Include in decks' }))
    await user.click(screen.getByRole('button', { name: 'Choose a deck' }))

    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByText('Where the cards go when you add them')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Pick a deck' })).toBeDisabled()
    await user.click(within(sheet).getByText('Memory work'))
    await user.click(within(sheet).getByRole('button', { name: 'Use Memory work' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Memory work')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeEnabled()
  })

  it('will not add to a new deck it has no name for — switched off before a book was picked', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) In the beginning.')
    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeEnabled()

    await user.click(screen.getByRole('switch', { name: 'Include in decks' }))

    // There is no chapter to name the deck after, so Add waits for a destination rather than
    // asking `createDeck` for a deck called ''.
    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeDisabled()
  })

  it('adds again once the new deck has been named', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) In the beginning.')
    await user.click(screen.getByRole('switch', { name: 'Include in decks' }))
    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'New deck' }))
    const sheet = await screen.findByRole('dialog')
    // The sheet names the deck; nothing is made until Add, and it says so.
    expect(within(sheet).getByText('It is made when you add the cards')).toBeInTheDocument()
    await user.type(within(sheet).getByRole('textbox', { name: 'Deck name' }), 'Memory work')
    await user.click(within(sheet).getByRole('button', { name: 'Use this name' }))

    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeEnabled()
  })

  it('opens on the deck the learner came from, with placement off', () => {
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

  it('keeps the text in the Bible library when dev mode is on, so the picker can prefill next time', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleImportPage />, { devMode: true })
    await pickGenesis11(user)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    await user.click(screen.getByRole('button', { name: 'Keep this text' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(1))
    expect(verseStore.getState().verses[0]?.text).toBe('In the beginning.')
  })

  it('offers no such button while dev mode is off', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    expect(screen.queryByRole('button', { name: 'Keep this text' })).not.toBeInTheDocument()
  })
})
