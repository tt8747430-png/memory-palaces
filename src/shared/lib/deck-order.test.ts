import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DECK_SORT,
  type DeckOrder,
  headingsFor,
  orderForChildren,
  resolveDeckSort,
  sortDecks,
} from './deck-order'

interface Row {
  id: string
  name: string
  createdAt: string
  due: number
}

const rows: Row[] = [
  { id: 'v', name: 'Verbs', createdAt: '2026-03-01T00:00:00.000Z', due: 2 },
  { id: 'a', name: 'Adjectives', createdAt: '2026-01-01T00:00:00.000Z', due: 9 },
  { id: 'n', name: 'Nouns', createdAt: '2026-02-01T00:00:00.000Z', due: 0 },
]

const names = (list: readonly Row[]) => list.map((r) => r.name)

describe('sortDecks', () => {
  it('hands the list back untouched for the manual order — a drag decides it', () => {
    expect(names(sortDecks(rows, 'manual'))).toEqual(['Verbs', 'Adjectives', 'Nouns'])
  })

  it('does not mutate the list it was given', () => {
    const before = names(rows)
    sortDecks(rows, 'name')
    expect(names(rows)).toEqual(before)
  })

  it('sorts by name', () => {
    expect(names(sortDecks(rows, 'name'))).toEqual(['Adjectives', 'Nouns', 'Verbs'])
  })

  it('sorts newest first for recent', () => {
    expect(names(sortDecks(rows, 'recent'))).toEqual(['Verbs', 'Nouns', 'Adjectives'])
  })

  it('puts the most waiting first, and falls back to the name on a tie', () => {
    expect(names(sortDecks(rows, 'due', (r) => r.due))).toEqual(['Adjectives', 'Verbs', 'Nouns'])
  })

  it('counts nothing as due when no counter is given, so the order is by name', () => {
    expect(names(sortDecks(rows, 'due'))).toEqual(['Adjectives', 'Nouns', 'Verbs'])
  })
})

describe('resolveDeckSort', () => {
  it('keeps an order it knows', () => {
    expect(resolveDeckSort('due')).toBe('due')
  })

  it('keeps an order an extension contributed — the Library decides later whether it is on', () => {
    expect(resolveDeckSort('bible:canon')).toBe('bible:canon')
  })

  it('falls back for anything that is not a name at all', () => {
    expect(resolveDeckSort(undefined)).toBe(DEFAULT_DECK_SORT)
    expect(resolveDeckSort('')).toBe(DEFAULT_DECK_SORT)
    expect(resolveDeckSort(7)).toBe(DEFAULT_DECK_SORT)
  })
})

/** A contributed order: decks whose name is a Greek letter, in Greek order, grouped by case. */
const GREEK = ['alpha', 'beta', 'gamma']
const greek: DeckOrder = {
  id: 'test:greek',
  rank: (deck) => {
    const at = GREEK.indexOf(deck.name.toLowerCase())
    return at < 0 ? null : at
  },
  group: (deck) =>
    GREEK.includes(deck.name.toLowerCase())
      ? deck.name === deck.name.toLowerCase()
        ? { id: 'lower', labelKey: 'test:lower' }
        : { id: 'upper', labelKey: 'test:upper' }
      : { id: 'other', labelKey: 'test:other' },
}

const row = (id: string, name: string): Row => ({
  id,
  name,
  createdAt: '2026-01-01T00:00:00.000Z',
  due: 0,
})

describe('a contributed order', () => {
  it('ranks what it knows, then puts the rest after it by name', () => {
    const decks = [row('1', 'Zeta'), row('2', 'gamma'), row('3', 'alpha'), row('4', 'Eta')]
    expect(names(sortDecks(decks, greek))).toEqual(['alpha', 'gamma', 'Eta', 'Zeta'])
  })

  it('names the group each run of rows opens, when there is more than one', () => {
    const decks = sortDecks([row('1', 'Beta'), row('2', 'gamma'), row('3', 'alpha')], greek)
    expect(names(decks)).toEqual(['alpha', 'Beta', 'gamma'])
    expect([...headingsFor(decks, greek)]).toEqual([
      ['3', { id: 'lower', labelKey: 'test:lower' }],
      ['1', { id: 'upper', labelKey: 'test:upper' }],
      ['2', { id: 'lower', labelKey: 'test:lower' }],
    ])
  })

  it('prints no heading over a single group, nor under a core order', () => {
    expect(headingsFor([row('1', 'alpha'), row('2', 'beta')], greek).size).toBe(0)
    expect(headingsFor(rows, 'name').size).toBe(0)
  })
})

describe('orderForChildren', () => {
  const prefs = { deckSort: 'name', deckSortSubdecks: true, subdeckSorts: { d1: 'recent' } }

  it('gives the top level the Library order', () => {
    expect(orderForChildren(null, prefs)).toBe('name')
  })

  it('gives a deck the order chosen for its subdecks, over the Library order', () => {
    expect(orderForChildren('d1', prefs)).toBe('recent')
    expect(orderForChildren('d2', prefs)).toBe('name')
  })

  it('leaves subdecks as they were dragged once the Library order stops at the top', () => {
    const own = { ...prefs, deckSortSubdecks: false }
    expect(orderForChildren('d2', own)).toBe('manual')
    expect(orderForChildren('d1', own)).toBe('recent')
  })
})

describe('sortDecks stability', () => {
  it('keeps decks that compare equal in the order they arrived', () => {
    const twins: Row[] = [
      { id: '1', name: 'Same', createdAt: '2026-01-01T00:00:00.000Z', due: 0 },
      { id: '2', name: 'Same', createdAt: '2026-01-01T00:00:00.000Z', due: 0 },
    ]
    const tagged = twins.map((row, i) => ({ ...row, tag: i }))
    expect(sortDecks(tagged, 'name').map((r) => r.tag)).toEqual([0, 1])
    expect(sortDecks(tagged, 'recent').map((r) => r.tag)).toEqual([0, 1])
    expect(sortDecks(tagged, 'due', (r) => r.due).map((r) => r.tag)).toEqual([0, 1])
  })
})

describe('natural name order', () => {
  it('puts chapter 2 before chapter 10', () => {
    const chapters = ['Geneza 10', 'Geneza 2', 'Geneza 1'].map((name) => ({
      id: name,
      name,
      createdAt: '2026-01-01T00:00:00.000Z',
      due: 0,
    }))
    expect(names(sortDecks(chapters, 'name'))).toEqual(['Geneza 1', 'Geneza 2', 'Geneza 10'])
  })
})
