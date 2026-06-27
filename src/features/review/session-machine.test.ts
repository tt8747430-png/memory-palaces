import { describe, expect, it } from 'vitest'
import {
  currentId,
  initSession,
  nextId,
  sessionProgress,
  sessionReducer,
  type BrowseState,
  type ReviewState,
  type SessionState,
} from './session-machine'

function review(ids: string[]): ReviewState {
  const state = initSession({ mode: 'review', ids })
  if (state.status !== 'review') throw new Error('expected a review session')
  return state
}

function browse(ids: string[]): BrowseState {
  const state = initSession({ mode: 'browse', ids })
  if (state.status !== 'browse') throw new Error('expected a browse session')
  return state
}

describe('initSession', () => {
  it('builds a review session from a queue', () => {
    expect(review(['a', 'b', 'c'])).toEqual({
      status: 'review',
      queue: ['a', 'b', 'c'],
      total: 3,
      graded: 0,
      piles: { learning: 0, known: 0 },
      flipped: false,
    })
  })

  it('builds a browse session at position 0', () => {
    expect(browse(['a', 'b'])).toEqual({
      status: 'browse',
      ids: ['a', 'b'],
      pos: 0,
      flipped: false,
    })
  })
})

describe('flip', () => {
  it('toggles the visible face', () => {
    const flipped = sessionReducer(review(['a']), { type: 'flip' })
    expect(flipped.status === 'review' && flipped.flipped).toBe(true)
  })

  it('is a no-op once complete', () => {
    const done: SessionState = { status: 'complete', graded: 1, piles: { learning: 0, known: 1 } }
    expect(sessionReducer(done, { type: 'flip' })).toBe(done)
  })
})

describe('grade (review)', () => {
  it('good dequeues the card, advances, counts it known, resets the flip', () => {
    const next = sessionReducer(
      { ...review(['a', 'b']), flipped: true },
      { type: 'grade', grade: 'good' },
    )
    expect(next).toEqual({
      status: 'review',
      queue: ['b'],
      total: 2,
      graded: 1,
      piles: { learning: 0, known: 1 },
      flipped: false,
    })
    expect(currentId(next)).toBe('b')
  })

  it('again requeues the card to the back without counting it graded', () => {
    const next = sessionReducer(review(['a', 'b']), { type: 'grade', grade: 'again' })
    expect(next.status === 'review' && next.queue).toEqual(['b', 'a'])
    expect(next.status === 'review' && next.graded).toBe(0)
    expect(next.status === 'review' && next.piles.learning).toBe(1)
  })

  it('hard counts toward the learning pile', () => {
    const next = sessionReducer(review(['a', 'b']), { type: 'grade', grade: 'hard' })
    expect(next.status === 'review' && next.piles).toEqual({ learning: 1, known: 0 })
  })

  it('completes when the last card leaves the queue', () => {
    const next = sessionReducer(review(['a']), { type: 'grade', grade: 'easy' })
    expect(next).toEqual({ status: 'complete', graded: 1, piles: { learning: 0, known: 1 } })
  })

  it('is ignored outside review mode', () => {
    const b = browse(['a'])
    expect(sessionReducer(b, { type: 'grade', grade: 'good' })).toBe(b)
  })
})

describe('skip', () => {
  it('rotates the current review card to the back', () => {
    const next = sessionReducer(review(['a', 'b', 'c']), { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['b', 'c', 'a'])
    expect(next.status === 'review' && next.graded).toBe(0)
  })

  it('advances in browse mode but stops at the end', () => {
    const advanced = sessionReducer(browse(['a', 'b']), { type: 'skip' })
    expect(advanced.status === 'browse' && advanced.pos).toBe(1)
    expect(sessionReducer(advanced, { type: 'skip' })).toBe(advanced)
  })
})

describe('browseNav', () => {
  it('clamps within bounds and resets the flip', () => {
    const start = { ...browse(['a', 'b', 'c']), flipped: true }
    expect(sessionReducer(start, { type: 'browseNav', delta: -1 })).toEqual({
      status: 'browse',
      ids: ['a', 'b', 'c'],
      pos: 0,
      flipped: false,
    })
    const last = sessionReducer(browse(['a', 'b']), { type: 'browseNav', delta: 5 })
    expect(last.status === 'browse' && last.pos).toBe(1)
  })
})

describe('finish + reset', () => {
  it('finish completes a review with its running tallies', () => {
    const mid = sessionReducer(review(['a', 'b']), { type: 'grade', grade: 'good' })
    expect(sessionReducer(mid, { type: 'finish' })).toEqual({
      status: 'complete',
      graded: 1,
      piles: { learning: 0, known: 1 },
    })
  })

  it('reset replaces the whole machine state', () => {
    const fresh = review(['x'])
    expect(sessionReducer(browse(['a']), { type: 'reset', state: fresh })).toBe(fresh)
  })
})

describe('selectors', () => {
  it('currentId / nextId track the active card', () => {
    const r = review(['a', 'b'])
    expect(currentId(r)).toBe('a')
    expect(nextId(r)).toBe('b')
    expect(
      currentId({ status: 'complete', graded: 0, piles: { learning: 0, known: 0 } }),
    ).toBeUndefined()
  })

  it('progress is graded/total in review and pos/length in browse', () => {
    expect(sessionProgress(review(['a', 'b', 'c', 'd']))).toBe(0)
    expect(sessionProgress({ ...browse(['a', 'b']), pos: 1 })).toBe(1)
    expect(
      sessionProgress({ status: 'complete', graded: 2, piles: { learning: 0, known: 2 } }),
    ).toBe(1)
  })
})
