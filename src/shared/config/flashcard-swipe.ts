/**
 * The flashcard deck's four-direction swipe vocabulary, shared by the study deck (which runs
 * the gestures) and the flashcard options sheet (which re-maps them). Pure data — no React,
 * no icons — so it lives in `shared/config` and can be imported anywhere. Distinct from the
 * list-row `swipe` config: those rows reveal action trays, whereas a flashcard commits one
 * action per fling in one of four directions.
 */

/** The four fling directions of the card deck. */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

export const SWIPE_DIRECTIONS: readonly SwipeDirection[] = ['up', 'down', 'left', 'right']

/** The four SM-2 grades — structurally the shared `Grade`, kept local so `shared/config`
 * stays free of `shared/lib`. */
export type GradeSwipeAction = 'again' | 'hard' | 'good' | 'easy'

/** What a fling in a direction does: grade the card, flag it, skip it, or nothing. */
export type FlashcardSwipeAction = GradeSwipeAction | 'flag' | 'skip' | 'none'

export const FLASHCARD_SWIPE_ACTIONS: readonly FlashcardSwipeAction[] = [
  'again',
  'hard',
  'good',
  'easy',
  'flag',
  'skip',
  'none',
]

/** Narrow a mapped action to a grade (the rest are gestures, not schedule writes). */
export function isGradeAction(action: FlashcardSwipeAction): action is GradeSwipeAction {
  return action === 'again' || action === 'hard' || action === 'good' || action === 'easy'
}

/** Visual register of an action, driving its chip + swipe-badge tint. Mirrors the grade
 * palette so a badge reads in the same colour language as the on-screen grade buttons. */
export interface FlashcardSwipeActionMeta {
  id: FlashcardSwipeAction
  labelKey: string
}

/** The action catalog, keyed by id. The label key is resolved with `t()` at render. */
export const FLASHCARD_SWIPE_ACTION_META: Record<FlashcardSwipeAction, FlashcardSwipeActionMeta> = {
  again: { id: 'again', labelKey: 'study.swipeActions.again' },
  hard: { id: 'hard', labelKey: 'study.swipeActions.hard' },
  good: { id: 'good', labelKey: 'study.swipeActions.good' },
  easy: { id: 'easy', labelKey: 'study.swipeActions.easy' },
  flag: { id: 'flag', labelKey: 'study.swipeActions.flag' },
  skip: { id: 'skip', labelKey: 'study.swipeActions.skip' },
  none: { id: 'none', labelKey: 'study.swipeActions.none' },
}

/** A fling in each of the four directions maps to exactly one action. */
export type FlashcardSwipeConfig = Record<SwipeDirection, FlashcardSwipeAction>

/** The out-of-the-box mapping — preserves the deck's original hardcoded gestures, with
 * Hard/Easy now available to assign in their place. */
export const DEFAULT_FLASHCARD_SWIPE: FlashcardSwipeConfig = {
  up: 'flag',
  down: 'skip',
  left: 'again',
  right: 'good',
}

/** Merge a (possibly partial / stale) stored map onto the defaults, dropping any direction
 * whose action is no longer offered so a retired action can never reach the gesture layer. */
export function normalizeFlashcardSwipe(
  config?: Partial<Record<SwipeDirection, FlashcardSwipeAction>>,
): FlashcardSwipeConfig {
  const allowed = new Set<FlashcardSwipeAction>(FLASHCARD_SWIPE_ACTIONS)
  const out = { ...DEFAULT_FLASHCARD_SWIPE }
  for (const dir of SWIPE_DIRECTIONS) {
    const action = config?.[dir]
    if (action && allowed.has(action)) out[dir] = action
  }
  return out
}
