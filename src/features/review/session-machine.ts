import type { Grade } from '@/shared/lib'

/**
 * The study-session State machine (pure, no IO). It owns only the session's
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

export interface BrowseState {
  status: 'browse'
  ids: string[]
  pos: number
  flipped: boolean
}

export interface CompleteState {
  status: 'complete'
  graded: number
  piles: Piles
}

export type SessionState = ReviewState | BrowseState | CompleteState

export type SessionAction =
  | { type: 'flip' }
  | { type: 'grade'; grade: Grade }
  | { type: 'skip' }
  | { type: 'browseNav'; delta: number }
  | { type: 'finish' }
  | { type: 'reset'; state: SessionState }

export interface InitParams {
  mode: 'review' | 'browse'
  /** Already scoped + ordered by the caller (review leads with due cards). */
  ids: string[]
}

export function initSession({ mode, ids }: InitParams): SessionState {
  if (mode === 'browse') {
    return { status: 'browse', ids, pos: 0, flipped: false }
  }
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
      if (state.status === 'review') {
        const current = state.queue[0]
        if (current === undefined || state.queue.length <= 1) {
          return { ...state, flipped: false }
        }
        return { ...state, queue: [...state.queue.slice(1), current], flipped: false }
      }
      if (state.status === 'browse') {
        if (state.pos >= state.ids.length - 1) return state
        return { ...state, pos: state.pos + 1, flipped: false }
      }
      return state
    }

    case 'browseNav': {
      if (state.status !== 'browse') return state
      const pos = Math.min(state.ids.length - 1, Math.max(0, state.pos + action.delta))
      return { ...state, pos, flipped: false }
    }

    case 'finish': {
      if (state.status === 'review') {
        return { status: 'complete', graded: state.graded, piles: state.piles }
      }
      if (state.status === 'browse') {
        return { status: 'complete', graded: 0, piles: { learning: 0, known: 0 } }
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
  if (state.status === 'browse') return state.ids[state.pos]
  return undefined
}

export function nextId(state: SessionState): string | undefined {
  if (state.status === 'review') return state.queue[1]
  if (state.status === 'browse') return state.ids[state.pos + 1]
  return undefined
}

/** Session completion in [0, 1] — graded/total in review, position in browse. */
export function sessionProgress(state: SessionState): number {
  if (state.status === 'review') return state.total > 0 ? state.graded / state.total : 0
  if (state.status === 'browse')
    return state.ids.length > 0 ? (state.pos + 1) / state.ids.length : 0
  return 1
}
