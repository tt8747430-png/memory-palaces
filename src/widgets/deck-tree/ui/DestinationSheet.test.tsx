import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { type Deck, makeDeck } from '@/entities/deck'
import { type Folder, makeFolder } from '@/entities/folder'
import type { DeckFilterContribution, DeckSortContribution } from '@/shared/lib'
import { renderInLibrary } from '../testing/render-in-library'
import { DestinationSheet } from './DestinationSheet'

afterEach(cleanup)

const CREATED = new Date(0).toISOString()

const deck = (id: string, extra: Partial<Deck> = {}): Deck => ({
  ...makeDeck({ id, createdAt: CREATED, name: id }),
  ...extra,
})

/** Books ranked by their place in a two-book canon, shelved by testament. */
const CANON = ['Genesis', 'Matthew']
const canon: DeckSortContribution = {
  id: 'test:canon',
  labelKey: 'test:sort.canon',
  icon: <span />,
  rank: (d) => (CANON.includes(d.name) ? CANON.indexOf(d.name) : null),
  group: (d) =>
    d.name === 'Genesis'
      ? { id: 'old', labelKey: 'test:shelf.old' }
      : d.name === 'Matthew'
        ? { id: 'new', labelKey: 'test:shelf.new' }
        : { id: 'other', labelKey: 'test:shelf.other' },
}
const newTestament: DeckFilterContribution = {
  id: 'test:new',
  labelKey: 'test:filter.new',
  icon: <span />,
  keep: (d) => d.name === 'Matthew',
}

const decks = [
  deck('Matthew', { order: 0 }),
  deck('Notes', { order: 1 }),
  deck('Genesis', { order: 2 }),
]

function renderSheet(
  prefs: { deckSort?: string; deckFilter?: string } = {},
  folders: Folder[] = [],
  extra: Deck[] = [],
) {
  return renderInLibrary(
    <DestinationSheet
      open
      onOpenChange={vi.fn()}
      subtitle="Moving"
      decks={[...decks, ...extra]}
      folders={folders}
      onPick={vi.fn()}
    />,
    { prefs, contributions: { deckSorts: [canon], deckFilters: [newTestament] } },
  )
}

const rowNames = () =>
  screen
    .getAllByRole('button', { pressed: false })
    // A deck with no icon of its own wears the default glyph ahead of its name.
    .map((button) => (button.textContent ?? '').replace(/^\P{L}+/u, ''))
    .filter((name) => ['Matthew', 'Notes', 'Genesis'].includes(name))

describe('DestinationSheet', () => {
  it('lists the decks in the order the Library shows them', () => {
    renderSheet({ deckSort: 'test:canon' })
    expect(rowNames()).toEqual(['Genesis', 'Matthew', 'Notes'])
  })

  it('prints the Library’s shelf headings between the runs', () => {
    renderSheet({ deckSort: 'test:canon' })
    // The keys are the extension's own; unresolved, i18next hands back the key past its namespace.
    expect(screen.getByText('shelf.old')).toBeInTheDocument()
    expect(screen.getByText('shelf.new')).toBeInTheDocument()
    expect(screen.getByText('shelf.other')).toBeInTheDocument()
  })

  it('keeps the drag order when the Library does', () => {
    renderSheet()
    expect(rowNames()).toEqual(['Matthew', 'Notes', 'Genesis'])
    expect(screen.queryByText('shelf.old')).not.toBeInTheDocument()
  })

  it('honours the Library filter, and says how much it is hiding', () => {
    renderSheet({ deckFilter: 'test:new' })
    expect(rowNames()).toEqual(['Matthew'])
    expect(screen.getByRole('status')).toHaveTextContent('1')
    expect(screen.getByRole('status')).toHaveTextContent('3')
  })

  it('says why the list is bare when the filter keeps nothing', () => {
    const bare = renderInLibrary(
      <DestinationSheet
        open
        onOpenChange={vi.fn()}
        subtitle="Moving"
        decks={[deck('Notes')]}
        folders={[]}
        onPick={vi.fn()}
      />,
      { prefs: { deckFilter: 'test:new' }, contributions: { deckFilters: [newTestament] } },
    )
    expect(bare.getAllByRole('status').at(-1)).toHaveTextContent('0')
  })

  it('offers a deck whose folder is gone, at the top, where it can be picked', () => {
    const gone = makeFolder({
      id: 'gone',
      createdAt: CREATED,
      name: 'Gone',
      color: 'sky',
      icon: '📁',
    })
    renderSheet({}, [], [deck('Stranded', { folderId: gone.id })])
    expect(screen.getByRole('button', { name: /Stranded/ })).toBeEnabled()
  })
})
