import { describe, expect, it } from 'vitest'
import {
  canUndo,
  type CompleteState,
  currentId,
  initSession,
  nextId,
  type ReviewState,
  sessionReducer,
  type SessionState,
} from './session-machine'

function review(ids: string[]): ReviewState {
  const state = initSession({ ids })
  if (state.status !== 'review') throw new Error('expected a review session')
  return state
}

const done = (over: Partial<Omit<CompleteState, 'status'>> = {}): CompleteState => ({
  status: 'complete',
  graded: 1,
  total: 1,
  piles: { learning: 0, known: 1 },
  history: [],
  ...over,
})

describe('initSession', () => {
  it('builds a review session from a queue', () => {
    expect(review(['a', 'b', 'c'])).toEqual({
      status: 'review',
      queue: ['a', 'b', 'c'],
      total: 3,
      graded: 0,
      piles: { learning: 0, known: 0 },
      flipped: false,
      history: [],
    })
  })
})

describe('flip', () => {
  it('toggles the visible face', () => {
    const flipped = sessionReducer(review(['a']), { type: 'flip' })
    expect(flipped.status === 'review' && flipped.flipped).toBe(true)
  })

  it('is a no-op once complete', () => {
    const complete = done()
    expect(sessionReducer(complete, { type: 'flip' })).toBe(complete)
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
    const complete = done()
    expect(sessionReducer(complete, { type: 'reveal' })).toBe(complete)
  })
})

describe('unflip', () => {
  it('returns a flipped card to the front', () => {
    const flipped = sessionReducer(review(['a']), { type: 'flip' })
    const front = sessionReducer(flipped, { type: 'unflip' })
    expect(front.status === 'review' && front.flipped).toBe(false)
  })

  it('is a no-op on an unflipped card and once complete', () => {
    const state = review(['a'])
    expect(sessionReducer(state, { type: 'unflip' })).toBe(state)
    const complete = done()
    expect(sessionReducer(complete, { type: 'unflip' })).toBe(complete)
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
      history: [{ queue: ['a', 'b'], graded: 0, piles: { learning: 0, known: 0 }, flipped: true }],
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
    expect(next).toEqual({
      status: 'complete',
      graded: 1,
      total: 1,
      piles: { learning: 0, known: 1 },
      history: [{ queue: ['a'], graded: 0, piles: { learning: 0, known: 0 }, flipped: false }],
    })
  })

  it('is ignored once complete', () => {
    const complete = done({ graded: 0, piles: { learning: 0, known: 0 } })
    expect(sessionReducer(complete, { type: 'grade', grade: 'good' })).toBe(complete)
  })
})

describe('skip', () => {
  it('rotates the current review card to the back', () => {
    const next = sessionReducer(review(['a', 'b', 'c']), { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['b', 'c', 'a'])
    expect(next.status === 'review' && next.graded).toBe(0)
  })

  it('unflips a single-card queue in place', () => {
    const one = { ...review(['a']), flipped: true }
    const next = sessionReducer(one, { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['a'])
    expect(next.status === 'review' && next.flipped).toBe(false)
  })
})

describe('undo', () => {
  it('is a no-op at the session start', () => {
    const start = review(['a', 'b'])
    expect(sessionReducer(start, { type: 'undo' })).toBe(start)
    expect(canUndo(start)).toBe(false)
  })

  it('steps back a graded card, restoring its position, tallies, and revealed face', () => {
    const graded = sessionReducer(
      { ...review(['a', 'b']), flipped: true },
      { type: 'grade', grade: 'good' },
    )
    expect(canUndo(graded)).toBe(true)
    const back = sessionReducer(graded, { type: 'undo' })
    expect(back).toEqual({
      status: 'review',
      queue: ['a', 'b'],
      total: 2,
      graded: 0,
      piles: { learning: 0, known: 0 },
      flipped: true,
      history: [],
    })
  })

  it('reverses an again requeue', () => {
    const again = sessionReducer(review(['a', 'b']), { type: 'grade', grade: 'again' })
    expect(again.status === 'review' && again.queue).toEqual(['b', 'a'])
    const back = sessionReducer(again, { type: 'undo' })
    expect(back.status === 'review' && back.queue).toEqual(['a', 'b'])
    expect(back.status === 'review' && back.piles.learning).toBe(0)
  })

  it('steps back repeatedly to the session start', () => {
    let state: SessionState = review(['a', 'b', 'c'])
    state = sessionReducer(state, { type: 'grade', grade: 'good' })
    state = sessionReducer(state, { type: 'grade', grade: 'hard' })
    expect(state.status === 'review' && state.queue).toEqual(['c'])
    state = sessionReducer(state, { type: 'undo' })
    state = sessionReducer(state, { type: 'undo' })
    expect(state).toEqual(review(['a', 'b', 'c']))
    expect(canUndo(state)).toBe(false)
  })

  it('re-enters review from a completed session', () => {
    const complete = sessionReducer(review(['a']), { type: 'grade', grade: 'good' })
    expect(complete.status).toBe('complete')
    const back = sessionReducer(complete, { type: 'undo' })
    expect(back.status).toBe('review')
    expect(currentId(back)).toBe('a')
    expect(back.status === 'review' && back.graded).toBe(0)
  })

  it('reverses a skip', () => {
    const skipped = sessionReducer(review(['a', 'b', 'c']), { type: 'skip' })
    expect(skipped.status === 'review' && skipped.queue).toEqual(['b', 'c', 'a'])
    const back = sessionReducer(skipped, { type: 'undo' })
    expect(back.status === 'review' && back.queue).toEqual(['a', 'b', 'c'])
  })
})

describe('finish + reset', () => {
  it('finish completes a review with its running tallies', () => {
    const mid = sessionReducer(review(['a', 'b']), { type: 'grade', grade: 'good' })
    const finished = sessionReducer(mid, { type: 'finish' })
    expect(finished.status).toBe('complete')
    expect(finished.graded).toBe(1)
    expect(finished.piles).toEqual({ learning: 0, known: 1 })
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
    expect(currentId(done())).toBeUndefined()
  })
})
