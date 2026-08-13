import { describe, expect, it } from 'vitest'
import type { SrsState } from '@/shared/lib'
import { type Card, makeCard } from '@/entities/card'
import {
  applyStudyFilter,
  buildStudyQueue,
  studyFilterCounts,
  studyFiltersEqual,
} from './study-filter'

const NOW = Date.UTC(2026, 0, 10)
const DAY = 86_400_000

function card(id: string, srs?: SrsState, flagged = false): Card {
  return {
    ...makeCard({ id, createdAt: new Date(0).toISOString(), deckId: 'd1', front: id, back: 'b' }),
    srs,
    flagged,
  }
}

const srs = (over: Partial<SrsState>): SrsState => ({
  due: new Date(NOW).toISOString(),
  interval: 3,
  ease: 2.5,
  reps: 2,
  lapses: 0,
  lastReviewed: new Date(NOW - DAY).toISOString(),
  ...over,
})

const fresh = card('new')
const due = card('due', srs({ due: new Date(NOW - DAY).toISOString() }))
const learning = card('learning', srs({ due: new Date(NOW + DAY).toISOString(), interval: 3 }))
const known = card('known', srs({ due: new Date(NOW + 30 * DAY).toISOString(), interval: 40 }))
const flagged = card(
  'flag',
  srs({ due: new Date(NOW + 30 * DAY).toISOString(), interval: 40 }),
  true,
)
const deck = [fresh, due, learning, known, flagged]

describe('applyStudyFilter', () => {
  it('all → the whole deck in order', () => {
    expect(applyStudyFilter(deck, { kind: 'all' }, NOW).map((c) => c.id)).toEqual([
      'new',
      'due',
      'learning',
      'known',
      'flag',
    ])
  })

  it('due → only cards due now (including brand-new)', () => {
    expect(applyStudyFilter(deck, { kind: 'due' }, NOW).map((c) => c.id)).toEqual(['new', 'due'])
  })

  it('new → only never-reviewed cards', () => {
    expect(applyStudyFilter(deck, { kind: 'new' }, NOW).map((c) => c.id)).toEqual(['new'])
  })

  it('learning → reviewed but not yet mature, due or not', () => {
    expect(applyStudyFilter(deck, { kind: 'learning' }, NOW).map((c) => c.id)).toEqual([
      'due',
      'learning',
    ])
  })

  it('flagged → only flagged cards', () => {
    expect(applyStudyFilter(deck, { kind: 'flagged' }, NOW).map((c) => c.id)).toEqual(['flag'])
  })
})

describe('studyFilterCounts', () => {
  it('counts each filter live', () => {
    expect(studyFilterCounts(deck, NOW)).toEqual({
      all: 5,
      due: 2,
      new: 1,
      learning: 2,
      flagged: 1,
    })
  })
})

describe('studyFiltersEqual', () => {
  it('compares the filter kind', () => {
    expect(studyFiltersEqual({ kind: 'all' }, { kind: 'all' })).toBe(true)
    expect(studyFiltersEqual({ kind: 'all' }, { kind: 'due' })).toBe(false)
    expect(studyFiltersEqual({ kind: 'flagged' }, { kind: 'flagged' })).toBe(true)
  })
})

describe('buildStudyQueue', () => {
  const options = {
    now: NOW,
    algorithm: 'spaced' as const,
    shuffle: false,
    newCardsPerDay: 10,
    maxCardsPerDay: 3000,
  }

  it('never queues a frozen card', () => {
    const cards = [card('a'), { ...card('b'), frozen: true }]
    expect(buildStudyQueue(cards, options)).toEqual(['a'])
  })

  it('caps the queue at the daily maximum', () => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`c${i}`))
    expect(buildStudyQueue(cards, { ...options, maxCardsPerDay: 5 })).toHaveLength(5)
  })

  it('limits how many never-studied cards enter', () => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`n${i}`))
    expect(buildStudyQueue(cards, { ...options, newCardsPerDay: 3 })).toHaveLength(3)
  })

  it('lets due cards through beyond the new-card limit', () => {
    const overdue = card('due', srs({ due: new Date(NOW - DAY).toISOString(), reps: 3 }))
    const cards = [overdue, card('n1'), card('n2')]
    expect(buildStudyQueue(cards, { ...options, newCardsPerDay: 1 })).toHaveLength(2)
  })

  it('offers every unfrozen card under fast review, ignoring schedules', () => {
    const future = card('f', srs({ due: new Date(NOW + 90 * DAY).toISOString(), interval: 90 }))
    const cards = [future, card('a')]
    expect(buildStudyQueue(cards, { ...options, algorithm: 'fast' })).toEqual(['f', 'a'])
  })

  it('caps fast review at the daily maximum too', () => {
    const cards = Array.from({ length: 9 }, (_, i) => card(`c${i}`))
    const queue = buildStudyQueue(cards, { ...options, algorithm: 'fast', maxCardsPerDay: 4 })
    expect(queue).toHaveLength(4)
  })
})
