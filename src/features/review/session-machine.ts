import type { Grade } from '@/shared/lib'
import type { FastOutcome } from '@/entities/card'
import { reinsertAhead } from './fast-review'

export type SessionMode = 'spaced' | 'fast'

export interface Piles {
  learning: number
  known: number
}

/** Which cards the learner has put where. Fast review counts cards, not answers. */
export interface Buckets {
  notQuite: string[]
  gotIt: string[]
}

export interface Snapshot {
  queue: string[]
  graded: number
  piles: Piles
  buckets: Buckets
  flipped: boolean
}

export interface ReviewState {
  status: 'review'
  mode: SessionMode
  queue: string[]
  total: number
  graded: number
  piles: Piles
  buckets: Buckets
  flipped: boolean
  history: Snapshot[]
}

export interface CompleteState {
  status: 'complete'
  mode: SessionMode
  graded: number
  total: number
  piles: Piles
  buckets: Buckets
  history: Snapshot[]
}

export type SessionState = ReviewState | CompleteState

export type SessionAction =
  | { type: 'flip' }
  | { type: 'reveal' }
  | { type: 'unflip' }
  | { type: 'grade'; grade: Grade }
  | { type: 'answer'; outcome: FastOutcome }
  | { type: 'skip' }
  | { type: 'undo' }
  | { type: 'finish' }
  | { type: 'reset'; state: SessionState }

export interface InitParams {
  ids: string[]
  mode: SessionMode
}

export function initSession({ ids, mode }: InitParams): SessionState {
  return {
    status: 'review',
    mode,
    queue: ids,
    total: ids.length,
    graded: 0,
    piles: { learning: 0, known: 0 },
    buckets: { notQuite: [], gotIt: [] },
    flipped: false,
    history: [],
  }
}

function isLearningGrade(grade: Grade): boolean {
  return grade === 'again' || grade === 'hard'
}

/** A card belongs to one bucket at a time, so moving it means dropping it from where it was. */
function withId(ids: string[], id: string, present: boolean): string[] {
  const without = ids.filter((each) => each !== id)
  return present ? [...without, id] : without
}

function snapshot(state: ReviewState): Snapshot {
  return {
    queue: state.queue,
    graded: state.graded,
    piles: state.piles,
    buckets: state.buckets,
    flipped: state.flipped,
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'flip': {
      if (state.status === 'complete') return state
      return { ...state, flipped: !state.flipped }
    }

    case 'reveal': {
      if (state.status === 'complete' || state.flipped) return state
      return { ...state, flipped: true }
    }

    case 'unflip': {
      if (state.status === 'complete' || !state.flipped) return state
      return { ...state, flipped: false }
    }

    case 'grade': {
      if (state.status !== 'review') return state
      const current = state.queue[0]
      if (current === undefined) return state
      const history = [...state.history, snapshot(state)]
      const rest = state.queue.slice(1)
      const requeue = action.grade === 'again'
      const learning = isLearningGrade(action.grade)
      const piles: Piles = {
        learning: state.piles.learning + (learning ? 1 : 0),
        known: state.piles.known + (learning ? 0 : 1),
      }
      const graded = requeue ? state.graded : state.graded + 1
      const queue = requeue ? [...rest, current] : rest
      if (queue.length === 0) {
        return {
          status: 'complete',
          mode: state.mode,
          graded,
          total: state.total,
          piles,
          buckets: state.buckets,
          history,
        }
      }
      return { ...state, queue, graded, piles, flipped: false, history }
    }

    case 'answer': {
      if (state.status !== 'review') return state
      const current = state.queue[0]
      if (current === undefined) return state
      const history = [...state.history, snapshot(state)]
      const rest = state.queue.slice(1)
      const gotIt = action.outcome === 'gotIt'
      const buckets: Buckets = {
        notQuite: withId(state.buckets.notQuite, current, !gotIt),
        gotIt: withId(state.buckets.gotIt, current, gotIt),
      }
      const queue = gotIt ? rest : reinsertAhead(rest, current)
      const graded = gotIt ? state.graded + 1 : state.graded
      if (queue.length === 0) {
        return {
          status: 'complete',
          mode: state.mode,
          graded,
          total: state.total,
          piles: state.piles,
          buckets,
          history,
        }
      }
      return { ...state, queue, graded, buckets, flipped: false, history }
    }

    case 'skip': {
      if (state.status !== 'review') return state
      const current = state.queue[0]
      if (current === undefined) return state
      const history = [...state.history, snapshot(state)]
      if (state.queue.length <= 1) {
        return { ...state, flipped: false, history }
      }
      return { ...state, queue: [...state.queue.slice(1), current], flipped: false, history }
    }

    case 'undo': {
      const last = state.history[state.history.length - 1]
      if (!last) return state
      return {
        status: 'review',
        mode: state.mode,
        queue: last.queue,
        total: state.total,
        graded: last.graded,
        piles: last.piles,
        buckets: last.buckets,
        flipped: last.flipped,
        history: state.history.slice(0, -1),
      }
    }

    case 'finish': {
      if (state.status === 'review') {
        return {
          status: 'complete',
          mode: state.mode,
          graded: state.graded,
          total: state.total,
          piles: state.piles,
          buckets: state.buckets,
          history: state.history,
        }
      }
      return state
    }

    case 'reset':
      return action.state

    default:
      return state
  }
}

export function currentId(state: SessionState): string | undefined {
  if (state.status === 'review') return state.queue[0]
  return undefined
}

export function upcomingIds(state: SessionState, count: number): string[] {
  if (state.status !== 'review') return []
  return state.queue.slice(1, 1 + count)
}

export function canUndo(state: SessionState): boolean {
  return state.history.length > 0
}
