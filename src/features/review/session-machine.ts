import type { Grade } from '@/shared/lib'

/**
 * The study-session state machine (pure, no IO). It owns only the session's
 * traversal — the queue/pointer, the flip, the running tallies — never the SRS
 * write; the widget pairs each `grade` dispatch with the `gradeCard` command so
 * scheduling and persistence stay at the edge.
 */
export interface Piles {
  learning: number
  known: number
}

export interface ReviewState {
  status: 'review'
  /** Remaining locus ids; the head is the active card. */
  queue: string[]
  /** Session size, fixed at start, for the progress bar. */
  total: number
  /** Cards graded (an `again` requeue does not count). */
  graded: number
  piles: Piles
  flipped: boolean
}

export interface CompleteState {
  status: 'complete'
  graded: number
  piles: Piles
}

export type SessionState = ReviewState | CompleteState

export type SessionAction =
  | { type: 'flip' }
  | { type: 'reveal' }
  | { type: 'unflip' }
  | { type: 'grade'; grade: Grade }
  | { type: 'skip' }
  | { type: 'finish' }
  | { type: 'reset'; state: SessionState }

export interface InitParams {
  /** Already scoped + ordered by the caller (review leads with due cards). */
  ids: string[]
}

export function initSession({ ids }: InitParams): SessionState {
  return {
    status: 'review',
    queue: ids,
    total: ids.length,
    graded: 0,
    piles: { learning: 0, known: 0 },
    flipped: false,
  }
}

/** `again`/`hard` land in the learning pile; `good`/`easy` in the known pile. */
function isLearningGrade(grade: Grade): boolean {
  return grade === 'again' || grade === 'hard'
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'flip': {
      if (state.status === 'complete') return state
      return { ...state, flipped: !state.flipped }
    }

    // One-way reveal for a solved recall attempt: showing the answer never toggles
    // it back, so a solve and a manual flip can't race into a hidden state.
    case 'reveal': {
      if (state.status === 'complete' || state.flipped) return state
      return { ...state, flipped: true }
    }

    // Back to the front face, idempotent — a mode switch resets the card to its start.
    case 'unflip': {
      if (state.status === 'complete' || !state.flipped) return state
      return { ...state, flipped: false }
    }

    case 'grade': {
      if (state.status !== 'review') return state
      const current = state.queue[0]
      if (current === undefined) return state
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
        return { status: 'complete', graded, piles }
      }
      return { ...state, queue, graded, piles, flipped: false }
    }

    case 'skip': {
      if (state.status !== 'review') return state
      const current = state.queue[0]
      if (current === undefined || state.queue.length <= 1) {
        return { ...state, flipped: false }
      }
      return { ...state, queue: [...state.queue.slice(1), current], flipped: false }
    }

    case 'finish': {
      if (state.status === 'review') {
        return { status: 'complete', graded: state.graded, piles: state.piles }
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

export function nextId(state: SessionState): string | undefined {
  if (state.status === 'review') return state.queue[1]
  return undefined
}
