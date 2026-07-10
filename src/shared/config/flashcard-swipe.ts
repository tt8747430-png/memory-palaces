/**
 * The flashcard deck's four-direction swipe vocabulary, shared by the study deck (which runs
 * the gestures) and the study sheets (which re-map them). Pure data — no React, no icons — so
 * it lives in `shared/config` and can be imported anywhere. Distinct from the list-row `swipe`
 * config: those rows reveal action trays, whereas a flashcard commits one action per fling in
 * one of four directions.
 *
 * The map is **per study mode**: every mode keeps its own direction→action assignment, and each
 * mode offers the shared actions plus a few of its own (Blur can hide/show, Type can advance a
 * word, …). `shared/config` may not import `entities`, so the four mode ids are mirrored here as
 * {@link FlashcardMode}; they are structurally the entity's `StudyMode`.
 */

/** The four fling directions of the card deck. */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

export const SWIPE_DIRECTIONS: readonly SwipeDirection[] = ['up', 'down', 'left', 'right']

/** Structural mirror of `entities/preferences` `StudyMode`, kept local so `shared/config` stays
 * free of the `entities` layer. Same order as `STUDY_MODES` (Blur → Rebuild → Initials → Type). */
export const FLASHCARD_MODES = ['blur', 'words', 'initials', 'type'] as const
export type FlashcardMode = (typeof FLASHCARD_MODES)[number]

/** The four SM-2 grades — structurally the shared `Grade`, kept local so `shared/config`
 * stays free of `shared/lib`. */
export type GradeSwipeAction = 'again' | 'hard' | 'good' | 'easy'

/** Actions any mode can bind: the four grades, plus flag / skip / off. */
export type SharedSwipeAction = GradeSwipeAction | 'flag' | 'skip' | 'none'

/** Actions a single mode adds to the shared set — its own on-card mechanic bound to a fling.
 * Each stays in place (never advances the deck); an action with nothing to do no-ops. */
export type ModeSwipeAction = 'hideMore' | 'showAll' | 'showWords' | 'reset' | 'nextWord'

/** What a fling in a direction does. The full catalog across every mode. */
export type FlashcardSwipeAction = SharedSwipeAction | ModeSwipeAction

const SHARED_ACTIONS: readonly SharedSwipeAction[] = [
  'again',
  'hard',
  'good',
  'easy',
  'flag',
  'skip',
  'none',
]

/** Each mode's own actions, appended after the shared set in the picker. */
const MODE_ACTIONS: Record<FlashcardMode, readonly ModeSwipeAction[]> = {
  blur: ['hideMore', 'showAll'],
  words: ['reset'],
  initials: ['showWords'],
  type: ['nextWord', 'reset'],
}

/** The picker's action list for a mode: the shared actions, then that mode's own. */
export function actionsForMode(mode: FlashcardMode): readonly FlashcardSwipeAction[] {
  return [...SHARED_ACTIONS, ...MODE_ACTIONS[mode]]
}

/** Whether an action may be bound in a given mode (shared everywhere; specifics only at home). */
export function isActionAllowed(mode: FlashcardMode, action: FlashcardSwipeAction): boolean {
  return actionsForMode(mode).includes(action)
}

export const FLASHCARD_SWIPE_ACTIONS: readonly FlashcardSwipeAction[] = [
  ...SHARED_ACTIONS,
  'hideMore',
  'showAll',
  'showWords',
  'reset',
  'nextWord',
]

/** Narrow a mapped action to a grade (the rest are gestures, not schedule writes). */
export function isGradeAction(action: FlashcardSwipeAction): action is GradeSwipeAction {
  return action === 'again' || action === 'hard' || action === 'good' || action === 'easy'
}

/** Narrow a mapped action to a mode-specific on-card mechanic. */
export function isModeAction(action: FlashcardSwipeAction): action is ModeSwipeAction {
  return (
    action === 'hideMore' ||
    action === 'showAll' ||
    action === 'showWords' ||
    action === 'reset' ||
    action === 'nextWord'
  )
}

/** Visual + label register of an action, driving its chip + swipe-badge tint. */
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
  hideMore: { id: 'hideMore', labelKey: 'study.swipeActions.hideMore' },
  showAll: { id: 'showAll', labelKey: 'study.swipeActions.showAll' },
  showWords: { id: 'showWords', labelKey: 'study.swipeActions.showWords' },
  reset: { id: 'reset', labelKey: 'study.swipeActions.reset' },
  nextWord: { id: 'nextWord', labelKey: 'study.swipeActions.nextWord' },
}

/** A fling in each of the four directions maps to exactly one action. */
export type FlashcardSwipeConfig = Record<SwipeDirection, FlashcardSwipeAction>

/** Every mode's own four-direction map. */
export type FlashcardSwipeByMode = Record<FlashcardMode, FlashcardSwipeConfig>

/** The out-of-the-box mapping for a single mode — preserves the deck's original gestures. */
export const DEFAULT_FLASHCARD_SWIPE: FlashcardSwipeConfig = {
  up: 'flag',
  down: 'skip',
  left: 'again',
  right: 'good',
}

/** Per-mode defaults: every mode starts from the familiar grade map; its specifics are opt-in. */
export function defaultFlashcardSwipeByMode(): FlashcardSwipeByMode {
  return {
    blur: { ...DEFAULT_FLASHCARD_SWIPE },
    words: { ...DEFAULT_FLASHCARD_SWIPE },
    initials: { ...DEFAULT_FLASHCARD_SWIPE },
    type: { ...DEFAULT_FLASHCARD_SWIPE },
  }
}

export const DEFAULT_FLASHCARD_SWIPE_BY_MODE: FlashcardSwipeByMode = defaultFlashcardSwipeByMode()

/** A stored value that carries a top-level direction key is the retired single-map shape. */
function isFlatConfig(value: Record<string, unknown>): boolean {
  return SWIPE_DIRECTIONS.some((dir) => dir in value)
}

/** Normalize one mode's map: keep a stored direction only if its action is offered in this
 * mode, else fall back to that direction's default — so a retired or foreign action can never
 * reach the gesture layer. */
function normalizeConfig(mode: FlashcardMode, config: unknown): FlashcardSwipeConfig {
  const source = (config ?? {}) as Partial<Record<SwipeDirection, FlashcardSwipeAction>>
  const out = { ...DEFAULT_FLASHCARD_SWIPE }
  for (const dir of SWIPE_DIRECTIONS) {
    const action = source[dir]
    if (action && isActionAllowed(mode, action)) out[dir] = action
  }
  return out
}

/** Merge a (possibly partial / stale / legacy-flat) stored map onto the per-mode defaults. A
 * legacy single map seeds every mode; a per-mode map is normalized mode by mode. */
export function normalizeFlashcardSwipe(config?: unknown): FlashcardSwipeByMode {
  const out = defaultFlashcardSwipeByMode()
  if (!config || typeof config !== 'object') return out
  const record = config as Record<string, unknown>
  if (isFlatConfig(record)) {
    for (const mode of FLASHCARD_MODES) out[mode] = normalizeConfig(mode, record)
    return out
  }
  for (const mode of FLASHCARD_MODES) out[mode] = normalizeConfig(mode, record[mode])
  return out
}
