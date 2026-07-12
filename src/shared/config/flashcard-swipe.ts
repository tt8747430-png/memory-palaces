
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

export const SWIPE_DIRECTIONS: readonly SwipeDirection[] = ['up', 'down', 'left', 'right']

export const FLASHCARD_MODES = ['blur', 'words', 'initials', 'type'] as const
export type FlashcardMode = (typeof FLASHCARD_MODES)[number]

export type GradeSwipeAction = 'again' | 'hard' | 'good' | 'easy'

export type SharedSwipeAction = GradeSwipeAction | 'flag' | 'skip' | 'none'

export type ModeSwipeAction = 'hideMore' | 'showAll' | 'showWords' | 'reset' | 'nextWord'

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

const MODE_ACTIONS: Record<FlashcardMode, readonly ModeSwipeAction[]> = {
  blur: ['hideMore', 'showAll'],
  words: ['reset'],
  initials: ['showWords'],
  type: ['nextWord', 'reset'],
}

export function actionsForMode(mode: FlashcardMode): readonly FlashcardSwipeAction[] {
  return [...SHARED_ACTIONS, ...MODE_ACTIONS[mode]]
}

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

export function isGradeAction(action: FlashcardSwipeAction): action is GradeSwipeAction {
  return action === 'again' || action === 'hard' || action === 'good' || action === 'easy'
}

export function isModeAction(action: FlashcardSwipeAction): action is ModeSwipeAction {
  return (
    action === 'hideMore' ||
    action === 'showAll' ||
    action === 'showWords' ||
    action === 'reset' ||
    action === 'nextWord'
  )
}

export interface FlashcardSwipeActionMeta {
  id: FlashcardSwipeAction
  labelKey: string
}

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

export type FlashcardSwipeConfig = Record<SwipeDirection, FlashcardSwipeAction>

export type FlashcardSwipeByMode = Record<FlashcardMode, FlashcardSwipeConfig>

export const DEFAULT_FLASHCARD_SWIPE: FlashcardSwipeConfig = {
  up: 'flag',
  down: 'skip',
  left: 'again',
  right: 'good',
}

export function defaultFlashcardSwipeByMode(): FlashcardSwipeByMode {
  return {
    blur: { ...DEFAULT_FLASHCARD_SWIPE },
    words: { ...DEFAULT_FLASHCARD_SWIPE },
    initials: { ...DEFAULT_FLASHCARD_SWIPE },
    type: { ...DEFAULT_FLASHCARD_SWIPE },
  }
}

export const DEFAULT_FLASHCARD_SWIPE_BY_MODE: FlashcardSwipeByMode = defaultFlashcardSwipeByMode()

function isFlatConfig(value: Record<string, unknown>): boolean {
  return SWIPE_DIRECTIONS.some((dir) => dir in value)
}

function normalizeConfig(mode: FlashcardMode, config: unknown): FlashcardSwipeConfig {
  const source = (config ?? {}) as Partial<Record<SwipeDirection, FlashcardSwipeAction>>
  const out = { ...DEFAULT_FLASHCARD_SWIPE }
  for (const dir of SWIPE_DIRECTIONS) {
    const action = source[dir]
    if (action && isActionAllowed(mode, action)) out[dir] = action
  }
  return out
}

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
