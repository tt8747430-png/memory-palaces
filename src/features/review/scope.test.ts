import { describe, expect, it } from 'vitest'
import type { SrsState } from '@/shared/lib'
import { type Locus, makeLocus } from '@/entities/locus'
import { applyScope, orderIds, rangeBatches, scopeCounts, scopesEqual } from './scope'

const NOW = Date.UTC(2026, 0, 10)
const DAY = 86_400_000

function card(id: string, srs?: SrsState, flagged = false): Locus {
  return {
    ...makeLocus({ id, createdAt: new Date(0).toISOString(), roomId: 'r1', front: id, back: 'b' }),
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

// One card of each status, plus a flagged one.
const fresh = card('new') // srs undefined → new + due
const due = card('due', srs({ due: new Date(NOW - DAY).toISOString() }))
const learning = card('learning', srs({ due: new Date(NOW + DAY).toISOString(), interval: 3 }))
const known = card('known', srs({ due: new Date(NOW + 30 * DAY).toISOString(), interval: 40 }))
const flagged = card(
  'flag',
  srs({ due: new Date(NOW + 30 * DAY).toISOString(), interval: 40 }),
  true,
)
const deck = [fresh, due, learning, known, flagged]

describe('applyScope', () => {
  it('all → the whole deck in order', () => {
    expect(applyScope(deck, { kind: 'all' }, NOW).map((c) => c.id)).toEqual([
      'new',
      'due',
      'learning',
      'known',
      'flag',
    ])
  })

  it('due → only cards due now (including brand-new)', () => {
    expect(applyScope(deck, { kind: 'due' }, NOW).map((c) => c.id)).toEqual(['new', 'due'])
  })

  it('new → only never-reviewed cards', () => {
    expect(applyScope(deck, { kind: 'new' }, NOW).map((c) => c.id)).toEqual(['new'])
  })

  it('learning → reviewed but not yet mature, due or not', () => {
    expect(applyScope(deck, { kind: 'learning' }, NOW).map((c) => c.id)).toEqual([
      'due',
      'learning',
    ])
  })

  it('flagged → only flagged cards', () => {
    expect(applyScope(deck, { kind: 'flagged' }, NOW).map((c) => c.id)).toEqual(['flag'])
  })

  it('range → a contiguous slice [start, end)', () => {
    expect(applyScope(deck, { kind: 'range', start: 1, end: 3 }, NOW).map((c) => c.id)).toEqual([
      'due',
      'learning',
    ])
  })
})

describe('scopeCounts', () => {
  it('counts each filter live', () => {
    expect(scopeCounts(deck, NOW)).toEqual({ all: 5, due: 2, new: 1, learning: 2, flagged: 1 })
  })
})

describe('rangeBatches', () => {
  it('is empty for a deck within one batch', () => {
    expect(rangeBatches(10)).toEqual([])
  })

  it('splits into labelled 1-indexed batches of the given size', () => {
    expect(rangeBatches(23, 10)).toEqual([
      { start: 0, end: 10, label: '1–10' },
      { start: 10, end: 20, label: '11–20' },
      { start: 20, end: 23, label: '21–23' },
    ])
  })
})

describe('scopesEqual', () => {
  it('compares kind and, for ranges, the bounds', () => {
    expect(scopesEqual({ kind: 'all' }, { kind: 'all' })).toBe(true)
    expect(scopesEqual({ kind: 'all' }, { kind: 'due' })).toBe(false)
    expect(
      scopesEqual({ kind: 'range', start: 0, end: 10 }, { kind: 'range', start: 0, end: 10 }),
    ).toBe(true)
    expect(
      scopesEqual({ kind: 'range', start: 0, end: 10 }, { kind: 'range', start: 0, end: 5 }),
    ).toBe(false)
  })
})

describe('orderIds', () => {
  it('inOrder keeps the deck order', () => {
    expect(orderIds(deck, 'inOrder')).toEqual(['new', 'due', 'learning', 'known', 'flag'])
  })

  it('reverse flips the order', () => {
    expect(orderIds(deck, 'reverse')).toEqual(['flag', 'known', 'learning', 'due', 'new'])
  })

  it('shuffle is a permutation of the same ids', () => {
    const out = orderIds(deck, 'shuffle', () => 0.5)
    expect([...out].sort()).toEqual(['due', 'flag', 'known', 'learning', 'new'])
  })
})
