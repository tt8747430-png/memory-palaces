import { describe, expect, it } from 'vitest'
import { headingsFor, sortDecks } from '@/shared/lib'
import { BOOK_FILTERS, BY_GENRE, CANON_ORDER, deckPlace } from './deck-orders'

const at = '2026-01-01T00:00:00.000Z'
const deck = (id: string, name: string) => ({ id, name, createdAt: at })

describe('deckPlace', () => {
  it('places a book deck by its book, under any of the book’s names', () => {
    expect(deckPlace('Geneza')).toEqual({ book: 'GEN', chapter: null })
    expect(deckPlace('1 Cor')).toEqual({ book: '1CO', chapter: null })
  })

  it('places a chapter deck by its book and chapter', () => {
    expect(deckPlace('Geneza 3')).toEqual({ book: 'GEN', chapter: 3 })
    expect(deckPlace('Psalmii 119')).toEqual({ book: 'PSA', chapter: 119 })
  })

  it('places nothing that is not a book — a chapter the book does not have included', () => {
    expect(deckPlace('Verbs')).toBeNull()
    expect(deckPlace('Geneza 51')).toBeNull()
    expect(deckPlace('Zeus 1')).toBeNull()
  })
})

describe('Biblical order', () => {
  it('puts books in canon order, chapters in number order, and the rest after by name', () => {
    const decks = [
      deck('r', 'Romani'),
      deck('v', 'Verbs'),
      deck('g10', 'Geneza 10'),
      deck('g2', 'Geneza 2'),
      deck('e', 'Exodul'),
      deck('a', 'Adjectives'),
    ]
    expect(sortDecks(decks, CANON_ORDER).map((d) => d.id)).toEqual([
      'g2',
      'g10',
      'e',
      'r',
      'a',
      'v',
    ])
  })

  it('heads each testament, and shelves what is not a book last', () => {
    const decks = sortDecks(
      [deck('v', 'Verbs'), deck('r', 'Romani'), deck('g', 'Geneza')],
      CANON_ORDER,
    )
    expect([...headingsFor(decks, CANON_ORDER)]).toEqual([
      ['g', { id: 'old', labelKey: 'bible:sort.oldTestament' }],
      ['r', { id: 'new', labelKey: 'bible:sort.newTestament' }],
      ['v', { id: 'other', labelKey: 'bible:sort.otherDecks' }],
    ])
  })
})

describe('By kind', () => {
  it('shelves the books by genre, in canon order within each', () => {
    const decks = sortDecks(
      [deck('am', 'Amos'), deck('is', 'Isaia'), deck('ex', 'Exodul'), deck('ho', 'Osea')],
      BY_GENRE,
    )
    expect(decks.map((d) => d.id)).toEqual(['ex', 'is', 'ho', 'am'])
    expect([...headingsFor(decks, BY_GENRE)]).toEqual([
      ['ex', { id: 'law', labelKey: 'bible:sort.genres.law' }],
      ['is', { id: 'majorProphets', labelKey: 'bible:sort.genres.majorProphets' }],
      ['ho', { id: 'minorProphets', labelKey: 'bible:sort.genres.minorProphets' }],
    ])
  })
})

describe('BOOK_FILTERS', () => {
  const filter = (id: string) => BOOK_FILTERS.find((f) => f.id === id)!

  it('offers a testament and every kind of book, each keeping its own', () => {
    expect(BOOK_FILTERS.map((f) => f.id)).toEqual([
      'bible:old',
      'bible:new',
      'bible:law',
      'bible:history',
      'bible:wisdom',
      'bible:majorProphets',
      'bible:minorProphets',
      'bible:gospels',
      'bible:acts',
      'bible:pauline',
      'bible:general',
      'bible:apocalyptic',
    ])
    expect(filter('bible:minorProphets').keep(deck('a', 'Amos'))).toBe(true)
    expect(filter('bible:minorProphets').keep(deck('a', 'Amos 3'))).toBe(true)
    expect(filter('bible:minorProphets').keep(deck('i', 'Isaia'))).toBe(false)
    expect(filter('bible:new').keep(deck('r', 'Romani'))).toBe(true)
    expect(filter('bible:old').keep(deck('r', 'Romani'))).toBe(false)
    expect(filter('bible:old').keep(deck('v', 'Verbs'))).toBe(false)
  })
})
