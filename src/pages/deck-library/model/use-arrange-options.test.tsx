import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { BookMarked } from 'lucide-react'
import { type Card, makeCard } from '@/entities/card'
import { type Deck, makeDeck } from '@/entities/deck'
import { ExtensionPointsContext } from '@/shared/lib'
import { useArrangeOptions } from './use-arrange-options'

afterEach(cleanup)

const at = (ms: number) => new Date(ms).toISOString()

const deck = (id: string, over: Partial<Deck> = {}): Deck => ({
  ...makeDeck({ id, createdAt: at(0), name: id.toUpperCase() }),
  ...over,
})

/** No `srs` at all reads as due, which is what a card nobody has studied yet is. */
const card = (id: string, deckId: string): Card =>
  makeCard({ id, createdAt: at(0), deckId, front: id, back: id })

const canon = { id: 'bible:canon', rank: (d: { name: string }) => (d.name === 'GENEZA' ? 0 : null) }
const law = {
  id: 'bible:law',
  labelKey: 'bible:law',
  icon: <BookMarked aria-hidden />,
  keep: (d: { name: string }) => d.name === 'GENEZA',
}

interface ArrangeCase {
  levelDecks?: Deck[]
  decks?: Deck[]
  cards?: Card[]
  enabled?: boolean
  scoped?: boolean
  deckSorts?: unknown[]
  deckFilters?: unknown[]
}

function arrange({
  levelDecks = [],
  decks = levelDecks,
  cards = [],
  enabled = true,
  scoped = false,
  deckSorts = [],
  deckFilters = [],
}: ArrangeCase = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ExtensionPointsContext value={{ deckSorts, deckFilters } as never}>
        {children}
      </ExtensionPointsContext>
    )
  }
  return renderHook(() => useArrangeOptions({ levelDecks, decks, cards, enabled, scoped }), {
    wrapper: Wrapper,
  }).result
}

describe('useArrangeOptions', () => {
  it('offers nothing at all while no selection is on — the bar is not there to pay for', () => {
    const { current } = arrange({
      levelDecks: [deck('a', { favorite: true }), deck('b')],
      enabled: false,
    })
    expect(current.sorts.size).toBe(0)
    expect(current.filters.size).toBe(0)
    expect(current.canSort).toBe(false)
    expect(current.canFilter).toBe(false)
  })

  it('always offers the three orders that read a row’s own fields', () => {
    const { current } = arrange({ levelDecks: [deck('a'), deck('b')] })
    expect([...current.sorts].toSorted()).toEqual(['manual', 'name', 'recent'])
  })

  it('withholds the Sort control for a single row — there is no arrangement to pick', () => {
    expect(arrange({ levelDecks: [deck('a')] }).current.canSort).toBe(false)
    expect(arrange({ levelDecks: [deck('a'), deck('b')] }).current.canSort).toBe(true)
  })

  it('offers only All where nothing narrows the list', () => {
    const { current } = arrange({ levelDecks: [deck('a'), deck('b')] })
    expect([...current.filters]).toEqual(['all'])
    expect(current.canFilter).toBe(false)
  })

  it('offers Favourites once a row is one', () => {
    const { current } = arrange({ levelDecks: [deck('a', { favorite: true }), deck('b')] })
    expect(current.filters.has('favorites')).toBe(true)
    expect(current.canFilter).toBe(true)
  })

  it('offers the due order and the due filter only while something is waiting', () => {
    const rows = [deck('a'), deck('b')]
    const without = arrange({ levelDecks: rows }).current
    expect(without.sorts.has('due')).toBe(false)
    expect(without.filters.has('due')).toBe(false)

    const withDue = arrange({ levelDecks: rows, cards: [card('c1', 'a')] }).current
    expect(withDue.sorts.has('due')).toBe(true)
    expect(withDue.filters.has('due')).toBe(true)
  })

  it('offers a contributed order only where it places one of these rows', () => {
    const away = arrange({ levelDecks: [deck('a'), deck('b')], deckSorts: [canon] })
    expect(away.current.sorts.has('bible:canon')).toBe(false)

    const home = arrange({ levelDecks: [deck('geneza'), deck('b')], deckSorts: [canon] })
    expect(home.current.sorts.has('bible:canon')).toBe(true)
  })

  it('offers a contributed filter only where it keeps one of these rows', () => {
    const away = arrange({ levelDecks: [deck('a'), deck('b')], deckFilters: [law] })
    expect(away.current.filters.has('bible:law')).toBe(false)

    const home = arrange({ levelDecks: [deck('geneza'), deck('b')], deckFilters: [law] })
    expect(home.current.filters.has('bible:law')).toBe(true)
  })

  it('offers the All-subdecks switch only where a live subdeck exists to reach', () => {
    const flat = [deck('a'), deck('b')]
    expect(arrange({ levelDecks: flat }).current.canAllSubdecks).toBe(false)

    const nested = [...flat, deck('a1', { parentId: 'a' })]
    expect(arrange({ levelDecks: flat, decks: nested }).current.canAllSubdecks).toBe(true)

    const archived = [...flat, deck('a1', { parentId: 'a', archived: true })]
    expect(arrange({ levelDecks: flat, decks: archived }).current.canAllSubdecks).toBe(false)
  })

  it('withholds the All-subdecks switch inside a scope — it would wipe the order set there', () => {
    const nested = [deck('a'), deck('b'), deck('a1', { parentId: 'a' })]
    expect(
      arrange({ levelDecks: [nested[2]!], decks: nested, scoped: true }).current.canAllSubdecks,
    ).toBe(false)
  })
})
