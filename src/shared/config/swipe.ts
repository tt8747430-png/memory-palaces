import { CARD_ACTIONS } from './actions'
import type { ActionId } from './actions'

export type SwipeItemType = 'deck' | 'folder' | 'card'

export const SWIPE_ITEM_TYPES: readonly SwipeItemType[] = ['deck', 'folder', 'card']

/** An action id that may sit on a swipe rail. `SWIPE_ACTIONS` is the real gate. */
export type SwipeActionId = ActionId

export const SWIPE_ACTIONS: Record<SwipeItemType, readonly SwipeActionId[]> = {
  deck: [
    'favorite',
    'move',
    'settings',
    'addSubdeck',
    'sortSubdecks',
    'duplicate',
    'archive',
    'delete',
  ],
  folder: ['edit', 'addDeck', 'delete'],
  card: CARD_ACTIONS,
}

export interface SwipeConfig {
  leading: SwipeActionId[]
  trailing: SwipeActionId[]
}

export type SwipePreferences = Record<SwipeItemType, SwipeConfig>

export const SWIPE_SIDE_MAX: Record<keyof SwipeConfig, number> = {
  leading: 2,
  trailing: 4,
}

export const DEFAULT_SWIPE: SwipePreferences = {
  deck: { leading: ['favorite'], trailing: ['move', 'archive', 'delete'] },
  folder: { leading: ['edit'], trailing: ['addDeck', 'delete'] },
  card: { leading: ['known'], trailing: ['flag', 'grade', 'move', 'delete'] },
}

export function withoutSwipeAction(config: SwipeConfig, id: SwipeActionId): SwipeConfig {
  return {
    leading: config.leading.filter((x) => x !== id),
    trailing: config.trailing.filter((x) => x !== id),
  }
}

/** Whether both rails are within what a row has the width to open. */
export function railsFit(config: SwipeConfig): boolean {
  return (
    config.leading.length <= SWIPE_SIDE_MAX.leading &&
    config.trailing.length <= SWIPE_SIDE_MAX.trailing
  )
}

/**
 * Which rail an added action lands on. Always the trailing one while it has room — that is the run
 * of caps on the right of the row, where a new action reads as "added at the end". Which side it
 * finally sits on is a drag afterwards, not a question asked before the learner can see the result.
 */
export function railWithRoom(config: SwipeConfig): keyof SwipeConfig | null {
  if (config.trailing.length < SWIPE_SIDE_MAX.trailing) return 'trailing'
  if (config.leading.length < SWIPE_SIDE_MAX.leading) return 'leading'
  return null
}

/**
 * The rails with `id` added at the end of the rail that has room (`railWithRoom`), taken off
 * wherever it was first so it is never on both. Unchanged when both rails are full.
 */
export function withSwipeAction(config: SwipeConfig, id: SwipeActionId): SwipeConfig {
  const without = withoutSwipeAction(config, id)
  const rail = railWithRoom(without)
  return rail ? { ...without, [rail]: [...without[rail], id] } : config
}

export function normalizeSwipeConfig(type: SwipeItemType, config: SwipeConfig): SwipeConfig {
  const allowed = new Set(SWIPE_ACTIONS[type])
  const clean = (ids: SwipeActionId[], side: keyof SwipeConfig) =>
    ids.filter((id) => allowed.has(id)).slice(0, SWIPE_SIDE_MAX[side])
  return { leading: clean(config.leading, 'leading'), trailing: clean(config.trailing, 'trailing') }
}
