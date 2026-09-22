import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Deck, makeDeck } from '@/entities/deck'
import { renderInLibrary } from '../testing/render-in-library'
import { DeckSwitcher } from './DeckSwitcher'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

const grammar = makeDeck({ id: 'grammar', createdAt: CREATED, name: 'Grammar' })
const verbs = makeDeck({
  id: 'verbs',
  createdAt: CREATED,
  name: 'Verbs',
  parentId: 'grammar',
  order: 0,
})
const nouns = makeDeck({
  id: 'nouns',
  createdAt: CREATED,
  name: 'Nouns',
  parentId: 'grammar',
  order: 1,
})
const shelved: Deck = { ...nouns, id: 'shelved', name: 'Shelved', archived: true, order: 2 }
const science = makeDeck({ id: 'science', createdAt: CREATED, name: 'Science' })

function props(overrides: Partial<Parameters<typeof DeckSwitcher>[0]> = {}) {
  return {
    deck: grammar,
    decks: [grammar, verbs, nouns, shelved, science],
    folders: [],
    onSwitch: vi.fn(),
    ...overrides,
  }
}

describe('DeckSwitcher', () => {
  it('shows the deck it is in, and opens on the name', async () => {
    const user = userEvent.setup()
    renderInLibrary(<DeckSwitcher {...props()} />)

    const trigger = screen.getByRole('button', { name: 'Switch from Grammar' })
    expect(trigger).toHaveTextContent('Grammar')
    await user.click(trigger)
    expect(screen.getByText('Verbs')).toBeInTheDocument()
  })

  it('lists the subdecks it carries, and leaves archived ones out', async () => {
    const user = userEvent.setup()
    renderInLibrary(<DeckSwitcher {...props()} />)

    await user.click(screen.getByRole('button', { name: 'Switch from Grammar' }))
    expect(screen.getByText('Verbs')).toBeInTheDocument()
    expect(screen.getByText('Nouns')).toBeInTheDocument()
    expect(screen.queryByText('Shelved')).not.toBeInTheDocument()
    // A sibling is not one hop from here — that is what More decks is for.
    expect(screen.queryByText('Science')).not.toBeInTheDocument()
  })

  it('switches to the subdeck that was picked', async () => {
    const user = userEvent.setup()
    const onSwitch = vi.fn()
    renderInLibrary(<DeckSwitcher {...props({ onSwitch })} />)

    await user.click(screen.getByRole('button', { name: 'Switch from Grammar' }))
    await user.click(screen.getByText('Nouns'))
    expect(onSwitch).toHaveBeenCalledWith('nouns')
  })

  it('offers More decks even from a deck that carries none', async () => {
    const user = userEvent.setup()
    renderInLibrary(<DeckSwitcher {...props({ deck: science })} />)

    await user.click(screen.getByRole('button', { name: 'Switch from Science' }))
    expect(screen.getByText('More decks…')).toBeInTheDocument()
    expect(
      screen.getByText('This deck has no subdecks yet. Find another deck to open.'),
    ).toBeInTheDocument()
  })

  it('opens the drawer from More decks, asking to open rather than to move', async () => {
    const user = userEvent.setup()
    renderInLibrary(<DeckSwitcher {...props()} />)

    await user.click(screen.getByRole('button', { name: 'Switch from Grammar' }))
    await user.click(screen.getByText('More decks…'))
    expect(screen.getByText('Open another deck')).toBeInTheDocument()
    expect(screen.getByText('Pick a deck to open')).toBeInTheDocument()
  })
})
