import type { Grade } from '@app/shared/domain'

export interface Piles {
  learning: number
  known: number
}

export interface Snapshot {
  queue: string[]
  graded: number
  piles: Piles
  flipped: boolean
}

export interface ReviewState {
  status: 'review'
  queue: string[]
  total: number
  graded: number
  piles: Piles
  flipped: boolean
  history: Snapshot[]
}

export interface CompleteState {
  status: 'complete'
  graded: number
  total: number
  piles: Piles
  history: Snapshot[]
}

export type SessionState = ReviewState | CompleteState

export type SessionAction =
  | { type: 'flip' }
  | { type: 'reveal' }
  | { type: 'unflip' }
  | { type: 'grade'; grade: Grade }
  | { type: 'skip' }
  | { type: 'undo' }
  | { type: 'finish' }
  | { type: 'reset'; state: SessionState }

export interface InitParams {
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
    history: [],
  }
}

function isLearningGrade(grade: Grade): boolean {
  return grade === 'again' || grade === 'hard'
}

function snapshot(state: ReviewState): Snapshot {
  return {
    queue: state.queue,
    graded: state.graded,
    piles: state.piles,
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
        return { status: 'complete', graded, total: state.total, piles, history }
      }
      return { ...state, queue, graded, piles, flipped: false, history }
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
        queue: last.queue,
        total: state.total,
        graded: last.graded,
        piles: last.piles,
        flipped: last.flipped,
        history: state.history.slice(0, -1),
      }
    }

    case 'finish': {
      if (state.status === 'review') {
        return {
          status: 'complete',
          graded: state.graded,
          total: state.total,
          piles: state.piles,
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

export function nextId(state: SessionState): string | undefined {
  if (state.status === 'review') return state.queue[1]
  return undefined
}

export function canUndo(state: SessionState): boolean {
  return state.history.length > 0
}
