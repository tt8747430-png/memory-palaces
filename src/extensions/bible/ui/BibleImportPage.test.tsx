import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/shared/i18n'
import { makeCard } from '@/entities/card'
import { bibleMessages } from '../i18n/en'
import { renderImportPage } from '../testing/render-import-page'
import { storedDeck } from '../testing/decks'
import { makeBibleVerse } from '../model/verse'
import { DEFAULT_TRANSLATION } from '../model/translations'
import { useImportDraft } from '@/widgets/content-editor'
import { BibleImportPage } from './BibleImportPage'

i18n.addResourceBundle('en', 'bible', bibleMessages, true, false)

const at = new Date(0).toISOString()
const verse = (number: number, text: string) =>
  makeBibleVerse({
    createdAt: at,
    translation: DEFAULT_TRANSLATION,
    book: 'GEN',
    chapter: 1,
    verse: number,
    text,
  })
afterEach(() => {
  cleanup()
  useImportDraft.getState().clear()
})

const pickGenesis11 = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Geneza' }))
  await user.click(screen.getByRole('button', { name: 'Chapter 1' }))
  await user.click(screen.getByRole('button', { name: 'Verse 1' }))
  await user.click(screen.getByRole('button', { name: 'Just verse 1' }))
  await user.click(screen.getByRole('button', { name: 'Use Geneza 1:1' }))
}

describe('BibleImportPage picker', () => {
  it('starts on the books, both testaments, with nothing to go back from', () => {
    renderImportPage(<BibleImportPage />)
    expect(screen.getByRole('heading', { name: 'Old Testament' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New Testament' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(66)
    expect(screen.queryByRole('navigation', { name: 'Passage' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start over' })).not.toBeInTheDocument()
  })

  it('offers every book, and marks the ones the Bible library holds text for', () => {
    renderImportPage(<BibleImportPage />, { verses: [verse(1, 'First.')] })
    expect(screen.getByRole('button', { name: 'Geneza, text saved' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Exodul' })).toBeEnabled()
  })

  it('opens chapter and verses on one step, and the breadcrumb goes back to the books', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Geneza' }))
    expect(screen.getByRole('heading', { name: 'Chapter' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chapter 1' }))
    expect(screen.getByRole('heading', { name: 'Verses' })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Passage' })
    await user.click(within(nav).getByRole('button', { name: 'Geneza' }))
    expect(screen.getByRole('heading', { name: 'Old Testament' })).toBeInTheDocument()
  })

  it('picks a range with two taps and confirms it', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByRole('button', { name: 'Geneza' }))
    await user.click(screen.getByRole('button', { name: 'Chapter 1' }))
    await user.click(screen.getByRole('button', { name: 'Verse 1' }))
    await user.click(screen.getByRole('button', { name: 'Verse 3' }))
    expect(screen.getByRole('button', { name: 'Verse 2' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Use Geneza 1:1-3' }))
    expect(screen.getByText('Geneza 1:1-3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
  })

  it('jumps straight to a passage typed in the field', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.type(
      screen.getByRole('searchbox', { name: 'Go to a passage' }),
      'ioan 3 16-18{Enter}',
    )
    expect(screen.getByText('Ioan 3:16-18')).toBeInTheDocument()
  })

  it('goes back to a chapter the learner added from recently', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, {
      decks: [storedDeck('deck-1')],
      cards: [
        makeCard({ id: 'c1', createdAt: at, deckId: 'deck-1', front: 'Ioan 3:16', back: 'x' }),
      ],
    })
    await user.click(screen.getByRole('button', { name: 'Ioan 3' }))
    expect(screen.getByRole('heading', { name: 'Verses' })).toBeInTheDocument()
  })

  it('keeps the text box on screen before anything is picked — pasting needs no picking', () => {
    renderImportPage(<BibleImportPage />)
    expect(screen.getByRole('textbox', { name: 'Verse text' })).toBeInTheDocument()
  })
})

describe('BibleImportPage text and target', () => {
  it('opens the text box empty when the Bible library holds nothing, and says so', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    expect(screen.getByLabelText('Verse text')).toHaveValue('')
    expect(screen.getByText('Not in your Bible library yet — paste it below')).toBeInTheDocument()
  })

  it('prefills with markers from the Bible library, and says where the text came from', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, {
      verses: [verse(1, 'First.'), verse(2, 'Second.')],
    })
    await user.type(screen.getByRole('searchbox', { name: 'Go to a passage' }), 'gen 1 1-2{Enter}')
    expect(await screen.findByText('Filled in from your Bible library.')).toBeInTheDocument()
    expect(screen.getByText('All 2 verses are in your Bible library')).toBeInTheDocument()
    expect(screen.getByLabelText('Verse text')).toHaveValue('1) First.\n2) Second.')
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })

  it('counts the cards it would add as the text is typed', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.type(screen.getByRole('searchbox', { name: 'Go to a passage' }), 'gen 1 1-2{Enter}')
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
    ).toEqual(['Geneza', 'Geneza 1'])
    expect(onReview).toHaveBeenCalled()
    expect(useImportDraft.getState().draft?.source).toBe('extension')
  })

  it('asks where the cards go when the toggle is off', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) In the beginning.')
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

  it('opens on the deck the learner came from, with placement off', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage deckId="deck-1" />, {
      decks: [storedDeck('deck-1', { name: 'Memory work' })],
    })
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('(1:1) In the beginning.')
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
          front: 'Geneza 1:1',
          back: 'In the beginning.',
        }),
      ],
    })
    await pickGenesis11(user)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    expect(screen.getByText('Already in your Bible library: Geneza 1:1.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Add/ })).toBeDisabled()
    await user.click(screen.getByRole('switch', { name: 'Add them again anyway' }))
    expect(screen.getByRole('button', { name: 'Add 1 card' })).toBeEnabled()
  })

  it('cannot add while the text box is empty', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    expect(screen.getByRole('button', { name: /^Add/ })).toBeDisabled()
  })

  it('saves pasted text for a passage the Bible library lacks, and says it will', async () => {
    const user = userEvent.setup()
    const { verseStore } = renderImportPage(<BibleImportPage />)
    await pickGenesis11(user)
    await user.click(screen.getByLabelText('Verse text'))
    await user.paste('In the beginning.')
    const save = screen.getByRole('switch', { name: 'Save 1 verse to your Bible library' })
    expect(save).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Add 1 card' }))
    await waitFor(() => expect(verseStore.getState().verses).toHaveLength(1))
    expect(verseStore.getState().verses[0]).toMatchObject({
      book: 'GEN',
      text: 'In the beginning.',
    })
  })

  it('names the verses a partly held passage still needs', async () => {
    const user = userEvent.setup()
    renderImportPage(<BibleImportPage />, { verses: [verse(1, 'First.'), verse(3, 'Third.')] })
    await user.type(screen.getByRole('searchbox', { name: 'Go to a passage' }), 'gen 1 1-3{Enter}')
    expect(
      screen.getByText('2 of 3 verses are in your Bible library — missing Geneza 1:2'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Verse 2 has no text yet — type or paste it after its number.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add 2 cards' })).toBeEnabled()
  })
})
