import { describe, expect, it } from 'vitest'
import { type Card, makeCard } from '@/entities/card'
import { cardListOptions } from './card-list'

const at = (ms: number) => new Date(ms).toISOString()

const card = (id: string, over: Partial<Card> = {}): Card => ({
  ...makeCard({ id, createdAt: at(0), deckId: 'd1', front: id, back: id }),
  ...over,
})

/** A card with a schedule behind it — anything but `reps: 0` reads as no longer new. */
const scheduled = (id: string, over: Partial<Card> = {}): Card =>
  card(id, {
    srs: { due: at(0), interval: 1, ease: 2.5, reps: 1, lapses: 0, lastReviewed: at(0) },
    ...over,
  })

describe('cardListOptions', () => {
  it('always offers the three orders that need nothing of a card but its own fields', () => {
    const { sorts } = cardListOptions([card('a'), card('b')], 'spaced')
    expect([...sorts].toSorted()).toEqual(['manual', 'name', 'recent'])
  })

  it('offers the due order only on a spaced deck that has scheduled something', () => {
    expect(cardListOptions([card('a')], 'spaced').sorts.has('due')).toBe(false)
    expect(cardListOptions([scheduled('a')], 'spaced').sorts.has('due')).toBe(true)
  })

  it('never offers the due order on a Fast deck, which keeps an outcome and not a date', () => {
    expect(cardListOptions([scheduled('a')], 'fast').sorts.has('due')).toBe(false)
  })

  it('offers the flag only where some cards are flagged and some are not', () => {
    expect(cardListOptions([card('a'), card('b')], 'spaced').flagged).toBe(false)
    expect(cardListOptions([card('a', { flagged: true }), card('b')], 'spaced').flagged).toBe(true)
  })

  it('withholds the flag when every card carries one — filtering to it keeps them all', () => {
    const all = [card('a', { flagged: true }), card('b', { flagged: true })]
    const options = cardListOptions(all, 'spaced')
    expect(options.flagged).toBe(false)
    expect(options.sorts.has('flagged')).toBe(false)
  })

  it('withholds a maturity bucket that holds every card', () => {
    const { maturity } = cardListOptions([card('a'), card('b')], 'spaced')
    expect(maturity.size).toBe(0)
  })

  it('offers both buckets once the cards are split between them', () => {
    const { maturity } = cardListOptions([card('a'), scheduled('b')], 'spaced')
    expect([...maturity].toSorted()).toEqual(['learning', 'new'])
  })

  it('has nothing to offer for a deck of identical cards, and says so', () => {
    expect(cardListOptions([card('a'), card('b')], 'spaced').any).toBe(false)
    expect(cardListOptions([card('a'), scheduled('b')], 'spaced').any).toBe(true)
  })

  it('has nothing to offer for no cards at all', () => {
    expect(cardListOptions([], 'spaced').any).toBe(false)
  })
})
