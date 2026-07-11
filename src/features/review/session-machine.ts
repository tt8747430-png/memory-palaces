import type { Grade } from '@/shared/lib'

/**
 * The study-session state machine (pure, no IO). It owns only the session's
 * traversal — the queue/pointer, the flip, the running tallies, and an undo
 * history — never the SRS write; the widget pairs each `grade` dispatch with the
 * `gradeCard` command (and each `undo` with a schedule restore) so scheduling and
 * persistence stay at the edge.
 */
export interface Piles {
  learning: number
  known: number
}

/** A pre-mutation snapshot pushed on every grade/skip so `undo` can step the deck
 * back one card at a time. Traversal only — the widget mirrors it with the card's
 * prior SRS schedule so undo can reverse the persisted grade too. */
export interface Snapshot {
  queue: string[]
  graded: number
  piles: Piles
  flipped: boolean
}

export interface ReviewState {
  status: 'review'
  /** Remaining card ids; the head is the active card. */
  queue: string[]
  /** Session size, fixed at start, for the progress bar. */
  total: number
  /** Cards graded (an `again` requeue does not count). */
  graded: number
  piles: Piles
  flipped: boolean
  /** LIFO stack of pre-mutation snapshots — one per grade/skip — powering `undo`. */
  history: Snapshot[]
}

export interface CompleteState {
  status: 'complete'
  graded: number
  /** Session size, carried through so `undo` can rebuild the review state's `total`. */
  total: number
  piles: Piles
  /** Carried through completion so a mis-graded last card can still be undone. */
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
    history: [],
  }
}

/** `again`/`hard` land in the learning pile; `good`/`easy` in the known pile. */
function isLearningGrade(grade: Grade): boolean {
  return grade === 'again' || grade === 'hard'
}

/** Capture the current traversal so a later `undo` can restore it verbatim. */
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

    // Step the deck back one card, restoring its queue position, tallies, and revealed
    // face. Repeatable to the session start; a no-op once history is empty. The widget
    // pairs this with restoring the card's prior SRS schedule.
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

/** Whether an `undo` would step the deck back (there is grade/skip history to reverse). */
export function canUndo(state: SessionState): boolean {
  return state.history.length > 0
}
