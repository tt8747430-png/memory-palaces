import { describe, expect, it } from 'vitest'
import { type DeckFilter, filterDecks } from './library-filter'

const deck = (id: string, favorite = false) => ({ id, name: id, createdAt: '', favorite })
const decks = [deck('a', true), deck('b'), deck('c')]
const due = (d: { id: string }) => (d.id === 'c' ? 2 : 0)

describe('filterDecks', () => {
  it('keeps everything, the favourites, or what has cards due', () => {
    expect(filterDecks(decks, 'all', due, []).map((d) => d.id)).toEqual(['a', 'b', 'c'])
    expect(filterDecks(decks, 'favorites', due, []).map((d) => d.id)).toEqual(['a'])
    expect(filterDecks(decks, 'due', due, []).map((d) => d.id)).toEqual(['c'])
  })

  it('keeps what a contributed filter keeps', () => {
    const vowels: DeckFilter = { id: 'test:vowels', keep: (d) => /^[aeiou]/.test(d.name) }
    expect(filterDecks(decks, 'test:vowels', due, [vowels]).map((d) => d.id)).toEqual(['a'])
  })

  it('hides nothing behind a filter nobody is offering', () => {
    expect(filterDecks(decks, 'test:gone', due, []).map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })
})
