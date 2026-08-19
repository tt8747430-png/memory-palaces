import { describe, expect, it } from 'vitest'
import { type Card, makeCard } from '@/entities/card'
import { fastOverview } from '@/shared/lib'
import { buildStudyQueue } from './study-filter'

const NOW = Date.UTC(2026, 0, 10)

const deck = (size: number, over: Partial<Card> = {}): Card[] =>
  Array.from({ length: size }, (_, i) => ({
    ...makeCard({
      id: `c${i}`,
      createdAt: new Date(0).toISOString(),
      deckId: 'd1',
      front: `f${i}`,
      back: 'b',
    }),
    ...over,
  }))

/**
 * The deck screen promises a number and the session has to deliver it. These two are computed by
 * different modules, so nothing but a test keeps them honest — this is the drift that shipped a
 * deck advertising 3000 cards and serving 10.
 */
describe('fast review offers exactly what it counts', () => {
  const served = (cards: Card[], maxCardsPerDay: number, newCardsPerDay = 10) =>
    buildStudyQueue(cards, {
      now: NOW,
      algorithm: 'fast',
      shuffle: false,
      newCardsPerDay,
      maxCardsPerDay,
    }).length

  it('agrees on a large deck of never-studied cards', () => {
    const cards = deck(6336)
    expect(fastOverview(cards, 3000).count).toBe(served(cards, 3000))
  })

  it('agrees when the deck is smaller than the ceiling', () => {
    const cards = deck(12)
    expect(fastOverview(cards, 3000).count).toBe(served(cards, 3000))
  })

  it('agrees when the new-card allowance is small — fast review does not apply it', () => {
    const cards = deck(40)
    expect(fastOverview(cards, 3000).count).toBe(served(cards, 3000, 1))
  })

  it('agrees once frozen cards are in the mix', () => {
    const cards = [...deck(5), ...deck(3, { frozen: true }).map((c, i) => ({ ...c, id: `z${i}` }))]
    expect(fastOverview(cards, 3000).count).toBe(served(cards, 3000))
  })
})
