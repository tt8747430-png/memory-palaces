import type { LearningAlgorithm } from './algorithms'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

const SWIPE_DIRECTIONS: readonly SwipeDirection[] = ['up', 'down', 'left', 'right']

const FLASHCARD_MODES = ['blur', 'words', 'initials', 'type'] as const
export type FlashcardMode = (typeof FLASHCARD_MODES)[number]

export type GradeSwipeAction = 'again' | 'hard' | 'good' | 'easy'

/** The two Fast review answers. They are not Grades — they never touch a schedule. */
export type FastSwipeAction = 'gotIt' | 'notQuite'

export type SharedSwipeAction = 'flag' | 'skip' | 'none'

export type ModeSwipeAction = 'hideMore' | 'showAll' | 'showWords' | 'reset' | 'nextWord'

export type FlashcardSwipeAction =
  GradeSwipeAction | FastSwipeAction | SharedSwipeAction | ModeSwipeAction

/** What every session offers, whatever it schedules with. */
const SHARED_ACTIONS: readonly SharedSwipeAction[] = ['flag', 'skip', 'none']

/**
 * What a session can answer a card with, by the Deck's Learning algorithm. A grade in a Fast review
 * would be swallowed — the footer there knows only Not quite and Got it — so it is not on offer.
 */
const ANSWER_ACTIONS: Record<LearningAlgorithm, readonly FlashcardSwipeAction[]> = {
  spaced: ['again', 'hard', 'good', 'easy'],
  fast: ['gotIt', 'notQuite'],
}

const MODE_ACTIONS: Record<FlashcardMode, readonly ModeSwipeAction[]> = {
  blur: ['hideMore', 'showAll'],
  words: ['reset'],
  initials: ['showWords'],
  type: ['nextWord', 'reset'],
}

/** Every action a direction may be set to, for one algorithm in one display mode. */
export function actionsFor(
  algorithm: LearningAlgorithm,
  mode: FlashcardMode,
): readonly FlashcardSwipeAction[] {
  return [...ANSWER_ACTIONS[algorithm], ...SHARED_ACTIONS, ...MODE_ACTIONS[mode]]
}

function isActionAllowed(
  algorithm: LearningAlgorithm,
  mode: FlashcardMode,
  action: FlashcardSwipeAction,
): boolean {
  return actionsFor(algorithm, mode).includes(action)
}

export function isGradeAction(action: FlashcardSwipeAction): action is GradeSwipeAction {
  return action === 'again' || action === 'hard' || action === 'good' || action === 'easy'
}

export function isFastAction(action: FlashcardSwipeAction): action is FastSwipeAction {
  return action === 'gotIt' || action === 'notQuite'
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
  gotIt: { id: 'gotIt', labelKey: 'study.swipeActions.gotIt' },
  notQuite: { id: 'notQuite', labelKey: 'study.swipeActions.notQuite' },
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

/** The whole setting: one config per display mode, per Learning algorithm. */
export type FlashcardSwipePreferences = Record<LearningAlgorithm, FlashcardSwipeByMode>

export const DEFAULT_FLASHCARD_SWIPE: Record<LearningAlgorithm, FlashcardSwipeConfig> = {
  spaced: { up: 'flag', down: 'skip', left: 'again', right: 'good' },
  fast: { up: 'flag', down: 'skip', left: 'notQuite', right: 'gotIt' },
}

function defaultsFor(algorithm: LearningAlgorithm): FlashcardSwipeByMode {
  const config = DEFAULT_FLASHCARD_SWIPE[algorithm]
  return {
    blur: { ...config },
    words: { ...config },
    initials: { ...config },
    type: { ...config },
  }
}

function defaultFlashcardSwipe(): FlashcardSwipePreferences {
  return { spaced: defaultsFor('spaced'), fast: defaultsFor('fast') }
}

export const DEFAULT_FLASHCARD_SWIPE_PREFERENCES: FlashcardSwipePreferences =
  defaultFlashcardSwipe()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** The oldest stored shape: one config for everything, `{ up, down, left, right }`. */
const isFlatConfig = (value: Record<string, unknown>): boolean =>
  SWIPE_DIRECTIONS.some((dir) => dir in value)

/** The shape before the algorithms were told apart: one config per display mode. */
const isByMode = (value: Record<string, unknown>): boolean =>
  FLASHCARD_MODES.some((mode) => mode in value)

function normalizeConfig(
  algorithm: LearningAlgorithm,
  mode: FlashcardMode,
  config: unknown,
): FlashcardSwipeConfig {
  const source = isRecord(config) ? (config as Partial<FlashcardSwipeConfig>) : {}
  const out = { ...DEFAULT_FLASHCARD_SWIPE[algorithm] }
  for (const dir of SWIPE_DIRECTIONS) {
    const action = source[dir]
    if (action && isActionAllowed(algorithm, mode, action)) out[dir] = action
  }
  return out
}

function normalizeByMode(algorithm: LearningAlgorithm, stored: unknown): FlashcardSwipeByMode {
  const record = isRecord(stored) ? stored : {}
  const flat = isFlatConfig(record)
  const out = defaultsFor(algorithm)
  for (const mode of FLASHCARD_MODES) {
    out[mode] = normalizeConfig(algorithm, mode, flat ? record : record[mode])
  }
  return out
}

/**
 * Reads whatever a device or another device's replication hands over: the config keyed by
 * algorithm, the older one keyed only by display mode, or the oldest flat one. An older shape was
 * always a Spaced repetition setting — Fast review had no answers to swipe to — so it lands there,
 * and Fast review starts from its own defaults.
 *
 * This is the read-side twin of the schema migration: replication writes pulled rows unmigrated,
 * so the entity has to recognise every shape the cloud may still hold.
 */
export function normalizeFlashcardSwipe(stored?: unknown): FlashcardSwipePreferences {
  if (!isRecord(stored)) return defaultFlashcardSwipe()
  if (isFlatConfig(stored) || isByMode(stored)) {
    return { spaced: normalizeByMode('spaced', stored), fast: defaultsFor('fast') }
  }
  return {
    spaced: normalizeByMode('spaced', stored.spaced),
    fast: normalizeByMode('fast', stored.fast),
  }
}

/** How a flashcard is answered: by throwing it, or by tapping the edge that carries the action. */
export const FLASHCARD_INPUTS = ['swipe', 'tap'] as const

export type FlashcardInput = (typeof FLASHCARD_INPUTS)[number]

export const DEFAULT_FLASHCARD_INPUT: FlashcardInput = 'swipe'

/**
 * The read-side twin of the schema step that added the setting: replication writes pulled rows
 * unmigrated, so a document from a device that has never heard of it arrives without the field.
 */
export function resolveFlashcardInput(stored?: unknown): FlashcardInput {
  return (FLASHCARD_INPUTS as readonly unknown[]).includes(stored)
    ? (stored as FlashcardInput)
    : DEFAULT_FLASHCARD_INPUT
}
