import { describe, expect, it } from 'vitest'
import { DEFAULT_DECK_SORT, resolveDeckSort, sortDecks } from './deck-order'

interface Row {
  name: string
  createdAt: string
  due: number
}

const rows: Row[] = [
  { name: 'Verbs', createdAt: '2026-03-01T00:00:00.000Z', due: 2 },
  { name: 'Adjectives', createdAt: '2026-01-01T00:00:00.000Z', due: 9 },
  { name: 'Nouns', createdAt: '2026-02-01T00:00:00.000Z', due: 0 },
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

  it('falls back for anything else — a row from a device that never had the field', () => {
    expect(resolveDeckSort(undefined)).toBe(DEFAULT_DECK_SORT)
    expect(resolveDeckSort('sideways')).toBe(DEFAULT_DECK_SORT)
    expect(resolveDeckSort(7)).toBe(DEFAULT_DECK_SORT)
  })
})
