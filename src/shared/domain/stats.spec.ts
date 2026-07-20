import { describe, expect, it } from 'vitest'
import {
  cardMaturityCounts,
  computeTrainingTotals,
  isCardReviewed,
  isDeckCompleted,
  levelFromXp,
} from './stats'
import type { SrsState } from './srs'

const reviewed: { srs?: SrsState } = {
  srs: { due: '', interval: 1, ease: 2.5, reps: 2, lapses: 0, lastReviewed: '' },
}
const fresh: { srs?: SrsState } = {}

describe('cardMaturityCounts', () => {
  it('tallies new / learning / known', () => {
    const cards = [
      { srs: undefined },
      { srs: { due: '', interval: 3, ease: 2.5, reps: 2, lapses: 0, lastReviewed: '' } },
      { srs: { due: '', interval: 40, ease: 2.5, reps: 5, lapses: 0, lastReviewed: '' } },
      { srs: { due: '', interval: 40, ease: 2.5, reps: 5, lapses: 0, lastReviewed: '' } },
    ]
    expect(cardMaturityCounts(cards)).toEqual({ new: 1, learning: 1, known: 2 })
  })
})

describe('levelFromXp', () => {
  it('maps xp onto 250-xp levels', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpInLevel: 0, xpForNextLevel: 250 })
    expect(levelFromXp(250)).toEqual({ level: 2, xpInLevel: 0, xpForNextLevel: 250 })
    expect(levelFromXp(600)).toEqual({ level: 3, xpInLevel: 100, xpForNextLevel: 250 })
  })
})

describe('isCardReviewed', () => {
  it('is true once a card has at least one rep', () => {
    expect(isCardReviewed(reviewed)).toBe(true)
    expect(isCardReviewed(fresh)).toBe(false)
  })
})

describe('isDeckCompleted', () => {
  it('is false for an empty deck and true only when every card is reviewed', () => {
    expect(isDeckCompleted([])).toBe(false)
    expect(isDeckCompleted([reviewed, fresh])).toBe(false)
    expect(isDeckCompleted([reviewed, reviewed])).toBe(true)
  })
})

describe('computeTrainingTotals', () => {
  const decks = [{ id: 'd1' }, { id: 'd2' }, { id: 'd3' }]
  const cards = [
    { deckId: 'd1', ...reviewed },
    { deckId: 'd1', ...reviewed },
    { deckId: 'd2', ...reviewed },
    { deckId: 'd2', ...fresh },
  ]

  it('reports total decks and total cards', () => {
    const totals = computeTrainingTotals(decks, cards)
    expect(totals.totalDecks).toBe(3)
    expect(totals.totalCards).toBe(4)
  })

  it('counts only decks whose every card is reviewed; empty decks never count', () => {
    expect(computeTrainingTotals(decks, cards).decksCompleted).toBe(1)
  })

  it('is all-zero with no decks or cards', () => {
    expect(computeTrainingTotals([], [])).toEqual({
      decksCompleted: 0,
      totalDecks: 0,
      totalCards: 0,
    })
  })
})
