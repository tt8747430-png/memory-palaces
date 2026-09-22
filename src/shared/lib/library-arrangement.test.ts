import { describe, expect, it, vi } from 'vitest'
import type { DeckFilter, DeckOrder } from './deck-order'
import {
  arrangeLibrary,
  type ArrangeableDeck,
  type ArrangeableFolder,
  filterDecks,
  type LibraryOrderPreferences,
  needsDueCounts,
} from './library-arrangement'

interface Row extends ArrangeableDeck {
  order: number
  due: number
}

const AT = '2026-01-01T00:00:00.000Z'

const deck = (id: string, extra: Partial<Row> = {}): Row => ({
  id,
  name: id,
  createdAt: AT,
  parentId: null,
  folderId: null,
  order: 0,
  favorite: false,
  archived: false,
  due: 0,
  ...extra,
})

const folder = (id: string, order: number, name = id): ArrangeableFolder => ({
  id,
  name,
  createdAt: AT,
  order,
})

const prefs = (extra: Partial<LibraryOrderPreferences> = {}): LibraryOrderPreferences => ({
  deckSort: 'manual',
  deckSortSubdecks: false,
  subdeckSorts: {},
  filter: 'all',
  ...extra,
})

/** Shelves by the first letter, ranking what it knows before what it does not. */
const byLetter: DeckOrder = {
  id: 'test:letter',
  rank: (d) => (/^[A-M]/.test(d.name) ? d.name.charCodeAt(0) : null),
  group: (d) =>
    /^[A-M]/.test(d.name)
      ? { id: 'early', labelKey: 'test:early' }
      : { id: 'other', labelKey: 'test:other' },
}

const firstHalf: DeckFilter = { id: 'test:first-half', keep: (d) => /^[A-M]/.test(d.name) }

const ids = (list: readonly { id: string }[]) => list.map((each) => each.id)

function arrange(
  decks: Row[],
  extra: Partial<LibraryOrderPreferences> = {},
  folders: ArrangeableFolder[] = [folder('f1', 0)],
) {
  return arrangeLibrary({
    decks,
    folders,
    prefs: prefs(extra),
    orders: [byLetter],
    filters: [firstHalf],
    dueOf: (d: Row) => d.due,
  })
}

describe('filterDecks', () => {
  const rows = [deck('a', { favorite: true }), deck('b'), deck('c', { due: 2 })]

  it('keeps everything, the favourites, or what has cards due', () => {
    const due = (d: Row) => d.due
    expect(ids(filterDecks(rows, 'all', due, []))).toEqual(['a', 'b', 'c'])
    expect(ids(filterDecks(rows, 'favorites', due, []))).toEqual(['a'])
    expect(ids(filterDecks(rows, 'due', due, []))).toEqual(['c'])
  })

  it('keeps what a contributed filter keeps', () => {
    const vowels: DeckFilter = { id: 'test:vowels', keep: (d) => /^[aeiou]/.test(d.name) }
    expect(ids(filterDecks(rows, 'test:vowels', (d) => d.due, [vowels]))).toEqual(['a'])
  })

  it('hides nothing behind a filter nobody is offering', () => {
    expect(ids(filterDecks(rows, 'test:gone', (d) => d.due, []))).toEqual(['a', 'b', 'c'])
  })
})

describe('needsDueCounts', () => {
  it('asks for the counts only where an order or the filter reads them', () => {
    expect(needsDueCounts(prefs())).toBe(false)
    expect(needsDueCounts(prefs({ deckSort: 'due' }))).toBe(true)
    expect(needsDueCounts(prefs({ filter: 'due' }))).toBe(true)
    expect(needsDueCounts(prefs({ subdeckSorts: { p: 'due' } }))).toBe(true)
  })
})

describe('arrangeLibrary', () => {
  const library = [
    deck('Nahum', { order: 0 }),
    deck('Amos', { order: 1 }),
    deck('Zechariah', { order: 2 }),
    deck('Hosea', { order: 3 }),
    deck('Hosea 2', { parentId: 'Hosea', order: 0 }),
    deck('Hosea 1', { parentId: 'Hosea', order: 1 }),
    deck('Filed', { folderId: 'f1', order: 0 }),
    deck('Put away', { archived: true }),
  ]

  it('keeps the drag order under the manual order', () => {
    expect(ids(arrange(library).shelf({ folderId: null }).decks)).toEqual([
      'Nahum',
      'Amos',
      'Zechariah',
      'Hosea',
    ])
  })

  it('arranges the top shelf by the Library order and heads each run with its group', () => {
    const top = arrange(library, { deckSort: 'test:letter' }).shelf({ folderId: null })
    expect(ids(top.decks)).toEqual(['Amos', 'Hosea', 'Nahum', 'Zechariah'])
    expect([...top.headings]).toEqual([
      ['Amos', { id: 'early', labelKey: 'test:early' }],
      ['Nahum', { id: 'other', labelKey: 'test:other' }],
    ])
  })

  it('narrows the list being read by the filter, and says how many it hides', () => {
    const top = arrange(library, { filter: 'test:first-half' }).shelf({ folderId: null })
    expect(ids(top.decks)).toEqual(['Amos', 'Hosea'])
    expect(ids(top.levelDecks)).toHaveLength(4)
    expect(top.hidden).toBe(2)
  })

  it('never narrows a deck’s own subdecks — a filter is about the list, not a deck', () => {
    const arrangement = arrange(library, { filter: 'test:first-half' })
    expect(ids(arrangement.subdecks('Hosea'))).toEqual(['Hosea 2', 'Hosea 1'])
  })

  it('orders subdecks by the order chosen for them, and by the Library order when it reaches down', () => {
    expect(ids(arrange(library, { subdeckSorts: { Hosea: 'name' } }).subdecks('Hosea'))).toEqual([
      'Hosea 1',
      'Hosea 2',
    ])
    expect(
      ids(arrange(library, { deckSort: 'name', deckSortSubdecks: true }).subdecks('Hosea')),
    ).toEqual(['Hosea 1', 'Hosea 2'])
  })

  it('reads a folder’s shelf and a scope the same way as the top', () => {
    const arrangement = arrange(library, {}, [folder('f1', 0)])
    expect(ids(arrangement.shelf({ folderId: 'f1' }).decks)).toEqual(['Filed'])
    expect(ids(arrangement.shelf({ deckId: 'Hosea' }).decks)).toEqual(['Hosea 2', 'Hosea 1'])
  })

  it('shelves the folders by the order they were dragged into, or by name when the order is one a shelf follows', () => {
    const folders = [folder('b', 0, 'Beta'), folder('a', 1, 'Alpha')]
    expect(ids(arrange(library, {}, folders).folders)).toEqual(['b', 'a'])
    expect(ids(arrange(library, { deckSort: 'name' }, folders).folders)).toEqual(['a', 'b'])
    // A contributed order says nothing about a folder: the dragged order stands.
    expect(ids(arrange(library, { deckSort: 'test:letter' }, folders).folders)).toEqual(['b', 'a'])
  })

  it('stands a deck whose folder is gone on the top shelf, where it can be found', () => {
    const orphaned = arrange(library, {}, [])
    expect(ids(orphaned.shelf({ folderId: null }).decks)).toContain('Filed')
    expect(orphaned.decks.find((d) => d.id === 'Filed')?.folderId).toBeNull()
  })

  it('opens every expanded deck beneath its row, deeper by one', () => {
    const rows = arrange(library, {}, [folder('f1', 0)]).flatten(
      { folderId: null },
      new Set(['Hosea']),
    )
    expect(rows.map((row) => [row.id, row.depth])).toEqual([
      ['Nahum', 0],
      ['Amos', 0],
      ['Zechariah', 0],
      ['Hosea', 0],
      ['Hosea 2', 1],
      ['Hosea 1', 1],
    ])
    expect(rows[3]).toMatchObject({ hasChildren: true, expanded: true })
    expect(rows[0]).toMatchObject({ hasChildren: false, expanded: false })
  })

  it('reads what is due only when something asks', () => {
    const dueOf = vi.fn((d: Row) => d.due)
    const quiet = arrangeLibrary({
      decks: library,
      folders: [],
      prefs: prefs({ deckSort: 'name' }),
      orders: [],
      filters: [],
      dueOf,
    })
    quiet.flatten({ folderId: null }, new Set(['Hosea']))
    expect(dueOf).not.toHaveBeenCalled()
  })
})
