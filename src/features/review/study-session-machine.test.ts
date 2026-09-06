import { describe, expect, it } from 'vitest'
import {
  canUndo,
  type CompleteState,
  currentId,
  initStudySession,
  type ReviewState,
  studySessionReducer,
  type StudySessionState,
} from './study-session-machine'

function review(ids: string[]): ReviewState {
  const state = initStudySession({ ids, mode: 'spaced' })
  if (state.status !== 'review') throw new Error('expected a review session')
  return state
}

const NO_BUCKETS = { notQuite: [], gotIt: [] }

const done = (over: Partial<Omit<CompleteState, 'status'>> = {}): CompleteState => ({
  status: 'complete',
  mode: 'spaced',
  graded: 1,
  total: 1,
  piles: { learning: 0, known: 1 },
  buckets: NO_BUCKETS,
  history: [],
  ...over,
})

describe('initStudySession', () => {
  it('builds a review session from a queue', () => {
    expect(review(['a', 'b', 'c'])).toEqual({
      status: 'review',
      mode: 'spaced',
      queue: ['a', 'b', 'c'],
      total: 3,
      graded: 0,
      piles: { learning: 0, known: 0 },
      buckets: NO_BUCKETS,
      flipped: false,
      history: [],
    })
  })
})

describe('flip', () => {
  it('toggles the visible face', () => {
    const flipped = studySessionReducer(review(['a']), { type: 'flip' })
    expect(flipped.status === 'review' && flipped.flipped).toBe(true)
  })

  it('is a no-op once complete', () => {
    const complete = done()
    expect(studySessionReducer(complete, { type: 'flip' })).toBe(complete)
  })
})

describe('reveal', () => {
  it('shows the answer one-way', () => {
    const revealed = studySessionReducer(review(['a']), { type: 'reveal' })
    expect(revealed.status === 'review' && revealed.flipped).toBe(true)
  })

  it('is idempotent once revealed', () => {
    const revealed = studySessionReducer(review(['a']), { type: 'reveal' })
    expect(studySessionReducer(revealed, { type: 'reveal' })).toBe(revealed)
  })

  it('is a no-op once complete', () => {
    const complete = done()
    expect(studySessionReducer(complete, { type: 'reveal' })).toBe(complete)
  })
})

describe('unflip', () => {
  it('returns a flipped card to the front', () => {
    const flipped = studySessionReducer(review(['a']), { type: 'flip' })
    const front = studySessionReducer(flipped, { type: 'unflip' })
    expect(front.status === 'review' && front.flipped).toBe(false)
  })

  it('is a no-op on an unflipped card and once complete', () => {
    const state = review(['a'])
    expect(studySessionReducer(state, { type: 'unflip' })).toBe(state)
    const complete = done()
    expect(studySessionReducer(complete, { type: 'unflip' })).toBe(complete)
  })
})

describe('grade', () => {
  it('good dequeues the card, advances, counts it known, resets the flip', () => {
    const next = studySessionReducer(
      { ...review(['a', 'b']), flipped: true },
      { type: 'grade', grade: 'good' },
    )
    expect(next).toEqual({
      status: 'review',
      mode: 'spaced',
      queue: ['b'],
      total: 2,
      graded: 1,
      piles: { learning: 0, known: 1 },
      buckets: NO_BUCKETS,
      flipped: false,
      history: [
        {
          queue: ['a', 'b'],
          graded: 0,
          piles: { learning: 0, known: 0 },
          buckets: NO_BUCKETS,
          flipped: true,
        },
      ],
    })
    expect(currentId(next)).toBe('b')
  })

  it('again requeues the card to the back without counting it graded', () => {
    const next = studySessionReducer(review(['a', 'b']), { type: 'grade', grade: 'again' })
    expect(next.status === 'review' && next.queue).toEqual(['b', 'a'])
    expect(next.status === 'review' && next.graded).toBe(0)
    expect(next.status === 'review' && next.piles.learning).toBe(1)
  })

  it('hard counts toward the learning pile', () => {
    const next = studySessionReducer(review(['a', 'b']), { type: 'grade', grade: 'hard' })
    expect(next.status === 'review' && next.piles).toEqual({ learning: 1, known: 0 })
  })

  it('completes when the last card leaves the queue', () => {
    const next = studySessionReducer(review(['a']), { type: 'grade', grade: 'easy' })
    expect(next).toEqual({
      status: 'complete',
      mode: 'spaced',
      graded: 1,
      total: 1,
      piles: { learning: 0, known: 1 },
      buckets: NO_BUCKETS,
      history: [
        {
          queue: ['a'],
          graded: 0,
          piles: { learning: 0, known: 0 },
          buckets: NO_BUCKETS,
          flipped: false,
        },
      ],
    })
  })

  it('is ignored once complete', () => {
    const complete = done({ graded: 0, piles: { learning: 0, known: 0 } })
    expect(studySessionReducer(complete, { type: 'grade', grade: 'good' })).toBe(complete)
  })
})

describe('skip', () => {
  it('rotates the current review card to the back', () => {
    const next = studySessionReducer(review(['a', 'b', 'c']), { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['b', 'c', 'a'])
    expect(next.status === 'review' && next.graded).toBe(0)
  })

  it('unflips a single-card queue in place', () => {
    const one = { ...review(['a']), flipped: true }
    const next = studySessionReducer(one, { type: 'skip' })
    expect(next.status === 'review' && next.queue).toEqual(['a'])
    expect(next.status === 'review' && next.flipped).toBe(false)
  })
})

describe('undo', () => {
  it('is a no-op at the session start', () => {
    const start = review(['a', 'b'])
    expect(studySessionReducer(start, { type: 'undo' })).toBe(start)
    expect(canUndo(start)).toBe(false)
  })

  it('steps back a graded card, restoring its position, tallies, and revealed face', () => {
    const graded = studySessionReducer(
      { ...review(['a', 'b']), flipped: true },
      { type: 'grade', grade: 'good' },
    )
    expect(canUndo(graded)).toBe(true)
    const back = studySessionReducer(graded, { type: 'undo' })
    expect(back).toEqual({
      status: 'review',
      mode: 'spaced',
      queue: ['a', 'b'],
      total: 2,
      graded: 0,
      piles: { learning: 0, known: 0 },
      buckets: NO_BUCKETS,
      flipped: true,
      history: [],
    })
  })

  it('reverses an again requeue', () => {
    const again = studySessionReducer(review(['a', 'b']), { type: 'grade', grade: 'again' })
    expect(again.status === 'review' && again.queue).toEqual(['b', 'a'])
    const back = studySessionReducer(again, { type: 'undo' })
    expect(back.status === 'review' && back.queue).toEqual(['a', 'b'])
    expect(back.status === 'review' && back.piles.learning).toBe(0)
  })

  it('steps back repeatedly to the session start', () => {
    let state: StudySessionState = review(['a', 'b', 'c'])
    state = studySessionReducer(state, { type: 'grade', grade: 'good' })
    state = studySessionReducer(state, { type: 'grade', grade: 'hard' })
    expect(state.status === 'review' && state.queue).toEqual(['c'])
    state = studySessionReducer(state, { type: 'undo' })
    state = studySessionReducer(state, { type: 'undo' })
    expect(state).toEqual(review(['a', 'b', 'c']))
    expect(canUndo(state)).toBe(false)
  })

  it('re-enters review from a completed session', () => {
    const complete = studySessionReducer(review(['a']), { type: 'grade', grade: 'good' })
    expect(complete.status).toBe('complete')
    const back = studySessionReducer(complete, { type: 'undo' })
    expect(back.status).toBe('review')
    expect(currentId(back)).toBe('a')
    expect(back.status === 'review' && back.graded).toBe(0)
  })

  it('reverses a skip', () => {
    const skipped = studySessionReducer(review(['a', 'b', 'c']), { type: 'skip' })
    expect(skipped.status === 'review' && skipped.queue).toEqual(['b', 'c', 'a'])
    const back = studySessionReducer(skipped, { type: 'undo' })
    expect(back.status === 'review' && back.queue).toEqual(['a', 'b', 'c'])
  })
})

describe('finish + reset', () => {
  it('finish completes a review with its running tallies', () => {
    const mid = studySessionReducer(review(['a', 'b']), { type: 'grade', grade: 'good' })
    const finished = studySessionReducer(mid, { type: 'finish' })
    expect(finished.status).toBe('complete')
    expect(finished.graded).toBe(1)
    expect(finished.piles).toEqual({ learning: 0, known: 1 })
  })

  it('reset replaces the whole machine state', () => {
    const fresh = review(['x'])
    expect(studySessionReducer(review(['a']), { type: 'reset', state: fresh })).toBe(fresh)
  })
})

describe('selectors', () => {
  it('currentId tracks the active card', () => {
    expect(currentId(review(['a', 'b']))).toBe('a')
    expect(currentId(done())).toBeUndefined()
  })
})

describe('fast review', () => {
  const start = () => initStudySession({ ids: ['a', 'b', 'c'], mode: 'fast' })

  it('starts every card outside both buckets', () => {
    const state = start()
    expect(state.buckets).toEqual({ notQuite: [], gotIt: [] })
  })

  it('sends a Not quite card back into the queue', () => {
    const state = studySessionReducer(start(), { type: 'answer', outcome: 'notQuite' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.queue).toContain('a')
    expect(state.queue[0]).toBe('b')
    expect(state.buckets.notQuite).toEqual(['a'])
  })

  it('retires a Got it card', () => {
    const state = studySessionReducer(start(), { type: 'answer', outcome: 'gotIt' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.queue).not.toContain('a')
    expect(state.buckets.gotIt).toEqual(['a'])
  })

  it('counts a card once however often it comes round', () => {
    let state: StudySessionState = initStudySession({ ids: ['a'], mode: 'fast' })
    state = studySessionReducer(state, { type: 'answer', outcome: 'notQuite' })
    state = studySessionReducer(state, { type: 'answer', outcome: 'notQuite' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.buckets.notQuite).toEqual(['a'])
  })

  it('moves a card out of Not quite when the learner finally gets it', () => {
    let state: StudySessionState = initStudySession({ ids: ['a'], mode: 'fast' })
    state = studySessionReducer(state, { type: 'answer', outcome: 'notQuite' })
    state = studySessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    expect(state.status).toBe('complete')
    expect(state.buckets).toEqual({ notQuite: [], gotIt: ['a'] })
  })

  it('completes only when every card has been got', () => {
    let state: StudySessionState = initStudySession({ ids: ['a', 'b'], mode: 'fast' })
    state = studySessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    expect(state.status).toBe('review')
    state = studySessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    expect(state.status).toBe('complete')
  })

  it('undoes an answer, buckets and all', () => {
    let state: StudySessionState = start()
    state = studySessionReducer(state, { type: 'answer', outcome: 'gotIt' })
    state = studySessionReducer(state, { type: 'undo' })
    if (state.status !== 'review') throw new Error('expected review')
    expect(state.queue).toEqual(['a', 'b', 'c'])
    expect(state.buckets.gotIt).toEqual([])
  })
})
