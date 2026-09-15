import type {
  SyncOutcome,
  SyncPhase,
  SyncReview,
  SyncReviewItem,
  SyncReviewRow,
} from '@/shared/lib'

export interface RunnerState {
  phase: SyncPhase
  error: string | null
  review: SyncReview | null
}

export type RunnerAction =
  | { type: 'started'; phase: 'syncing' | 'restoring' }
  | { type: 'settled'; outcome: SyncOutcome }
  | { type: 'reviewOpened'; items: SyncReviewItem[] }
  | { type: 'reviewDescribed'; items: SyncReviewItem[]; rows: SyncReviewRow[] }
  | { type: 'reviewDescribeFailed'; items: SyncReviewItem[] }
  | { type: 'dismissed' }
  | { type: 'acknowledged' }

export const INITIAL_RUNNER_STATE: RunnerState = { phase: 'idle', error: null, review: null }

const opened = (items: SyncReviewItem[]): SyncReview => ({ items, rows: { state: 'loading' } })

function settled(outcome: SyncOutcome): RunnerState {
  switch (outcome.kind) {
    case 'clean':
    case 'merged':
      return { phase: 'synced', error: null, review: null }
    case 'needs-review':
      return { phase: 'idle', error: null, review: opened(outcome.items) }
    case 'offline':
      return { phase: 'idle', error: null, review: null }
    case 'failed':
      return { phase: 'failed', error: outcome.reason, review: null }
  }
}

const describes = (state: RunnerState, items: SyncReviewItem[]): boolean =>
  state.review?.items === items

export function runnerReducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case 'started':
      return { phase: action.phase, error: null, review: null }
    case 'settled':
      return settled(action.outcome)
    case 'reviewOpened':
      return { ...state, review: opened(action.items) }
    case 'reviewDescribed':
      return describes(state, action.items)
        ? { ...state, review: { items: action.items, rows: { state: 'ready', rows: action.rows } } }
        : state
    case 'reviewDescribeFailed':
      return describes(state, action.items)
        ? { ...state, review: { items: action.items, rows: { state: 'failed' } } }
        : state
    case 'dismissed':
      return { ...state, phase: 'idle', review: null }
    case 'acknowledged':
      return state.phase === 'synced' ? { ...state, phase: 'idle' } : state
  }
}
