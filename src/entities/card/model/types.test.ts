import { describe, expect, it } from 'vitest'
import { makeCard, updateCard } from './types'

const base = {
  id: 'c1',
  createdAt: '2026-01-01T00:00:00.000Z',
  deckId: 'd1',
  front: ' agape',
  back: 'love',
}

describe('makeCard', () => {
  it('creates a card scoped to a deck, new (no srs)', () => {
    const card = makeCard(base)
    expect(card.deckId).toBe('d1')
    expect(card.srs).toBeUndefined()
    expect(card.flagged).toBe(false)
    expect(card.memorized).toBe(false)
  })

  it('requires a deck, a front and a back', () => {
    expect(() => makeCard({ ...base, deckId: '' })).toThrow()
    expect(() => makeCard({ ...base, front: ' ' })).toThrow()
    expect(() => makeCard({ ...base, back: ' ' })).toThrow()
  })
})

describe('updateCard', () => {
  it('edits front/back and stamps updatedAt, keeping the deck', () => {
    const card = makeCard(base)
    const edited = updateCard(card, { back: 'charity' }, '2026-02-01T00:00:00.000Z')
    expect(edited.back).toBe('charity')
    expect(edited.deckId).toBe('d1')
    expect(edited.updatedAt).toBe('2026-02-01T00:00:00.000Z')
  })
})

describe('card learner flags', () => {
  const flagBase = {
    id: 'c1',
    createdAt: new Date(0).toISOString(),
    deckId: 'd1',
    front: 'f',
    back: 'b',
  }

  it('defaults frozen and reversed to false and leaves the bucket unset', () => {
    const card = makeCard(flagBase)
    expect(card.frozen).toBe(false)
    expect(card.reversed).toBe(false)
    expect(card.fastReview).toBeUndefined()
  })

  it('accepts the flags through makeCard', () => {
    const card = makeCard({ ...flagBase, frozen: true, reversed: true, fastReview: 'gotIt' })
    expect(card.frozen).toBe(true)
    expect(card.reversed).toBe(true)
    expect(card.fastReview).toBe('gotIt')
  })

  it('updates the bucket without touching the rest', () => {
    const card = makeCard(flagBase)
    const next = updateCard(card, { fastReview: 'notQuite' }, new Date(1).toISOString())
    expect(next.fastReview).toBe('notQuite')
    expect(next.front).toBe('f')
  })
})
