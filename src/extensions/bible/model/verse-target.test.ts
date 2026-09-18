import { describe, expect, it } from 'vitest'
import { targetIsResolvable } from './verse-target'

describe('targetIsResolvable', () => {
  it('accepts an existing deck', () => {
    expect(targetIsResolvable({ kind: 'deck', deckId: 'd1' })).toBe(true)
  })

  it('accepts automatic placement, which names its own decks', () => {
    expect(targetIsResolvable({ kind: 'automatic' })).toBe(true)
  })

  it('accepts a new deck that has a name', () => {
    expect(targetIsResolvable({ kind: 'newDeck', name: 'Genesis 1' })).toBe(true)
  })

  it('refuses a new deck with no name — switched off before a book was picked', () => {
    expect(targetIsResolvable({ kind: 'newDeck', name: '' })).toBe(false)
    expect(targetIsResolvable({ kind: 'newDeck', name: '   ' })).toBe(false)
  })
})
