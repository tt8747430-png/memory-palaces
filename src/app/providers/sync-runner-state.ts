import type {
  SyncOutcome,
  SyncPhase,
  SyncReview,
  SyncReviewItem,
  SyncReviewRow,
} from '@/shared/lib'

export interface RunnerState {
  phase: SyncPhase
  /** Why the last Sync failed, for the banner to show beside Retry. */
  error: string | null
  /** The open review. Non-null means a Sync stopped to ask. */
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

/**
 * Names that arrive for a review no longer open — dismissed, or replaced by a newer one — are
 * dropped. The check is on the very array the review was opened with: it is the review's identity.
 */
const describes = (state: RunnerState, items: SyncReviewItem[]): boolean =>
  state.review?.items === items

/**
 * The banner's side of a Sync, as one reducer: the phase, the failure reason and the open review
 * change together, so they are decided together. Every outcome is handled here and nowhere else in
 * the provider.
 */
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
    // A dismissed dialog cancels the Sync entirely — nothing is half-applied and the log is
    // untouched, so the banner still says exactly what is waiting.
    case 'dismissed':
      return { ...state, phase: 'idle', review: null }
    // The success state is a moment, not a place: it clears itself.
    case 'acknowledged':
      return state.phase === 'synced' ? { ...state, phase: 'idle' } : state
  }
}
