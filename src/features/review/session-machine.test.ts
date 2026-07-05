import { describe, expect, it } from 'vitest'
import {
  currentId,
  initSession,
  nextId,
  type ReviewState,
  sessionProgress,
  sessionReducer,
  type SessionState,
} from './session-machine'

function review(ids: string[]): ReviewState {
  const state = initSession({ ids })
  if (state.status !== 'review') throw new Error('expected a review session')
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

describe('reveal', () => {
  it('shows the answer one-way', () => {
    const revealed = sessionReducer(review(['a']), { type: 'reveal' })
    expect(revealed.status === 'review' && revealed.flipped).toBe(true)
  })

  it('is idempotent once revealed', () => {
    const revealed = sessionReducer(review(['a']), { type: 'reveal' })
    expect(sessionReducer(revealed, { type: 'reveal' })).toBe(revealed)
  })

  it('is a no-op once complete', () => {
    const done: SessionState = { status: 'complete', graded: 1, piles: { learning: 0, known: 1 } }
    expect(sessionReducer(done, { type: 'reveal' })).toBe(done)
  })
})

describe('grade', () => {
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

  it('is ignored once complete', () => {
    const done: SessionState = { status: 'complete', graded: 0, piles: { learning: 0, known: 0 } }
    expect(sessionReducer(done, { type: 'grade', grade: 'good' })).toBe(done)
  })
})

describe('skip', () => {
  it('rotates the current review card to the back', () => {
    const next = sessionReducer(review(['a', 'b', 'c']), { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['b', 'c', 'a'])
    expect(next.status === 'review' && next.graded).toBe(0)
  })

  it('is a no-op on a single-card queue', () => {
    const one = review(['a'])
    const next = sessionReducer(one, { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['a'])
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
    expect(sessionReducer(review(['a']), { type: 'reset', state: fresh })).toBe(fresh)
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

  it('progress is graded/total in review and 1 once complete', () => {
    expect(sessionProgress(review(['a', 'b', 'c', 'd']))).toBe(0)
    expect(
      sessionProgress({ status: 'complete', graded: 2, piles: { learning: 0, known: 2 } }),
    ).toBe(1)
  })
})
