import type { ActionId } from './actions'

export type SwipeItemType = 'deck' | 'folder' | 'card'

export const SWIPE_ITEM_TYPES: readonly SwipeItemType[] = ['deck', 'folder', 'card']

export type SwipeActionId = Exclude<ActionId, 'unfile'>

export const SWIPE_ACTIONS: Record<SwipeItemType, readonly SwipeActionId[]> = {
  deck: ['favorite', 'move', 'settings', 'addSubdeck', 'duplicate', 'archive', 'delete'],
  folder: ['edit', 'addDeck', 'delete'],
  card: ['flag', 'known', 'reset', 'duplicate', 'delete'],
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
  card: { leading: ['known'], trailing: ['flag', 'delete'] },
}

export function normalizeSwipeConfig(type: SwipeItemType, config: SwipeConfig): SwipeConfig {
  const allowed = new Set(SWIPE_ACTIONS[type])
  const clean = (ids: SwipeActionId[], side: keyof SwipeConfig) =>
    ids.filter((id) => allowed.has(id)).slice(0, SWIPE_SIDE_MAX[side])
  return { leading: clean(config.leading, 'leading'), trailing: clean(config.trailing, 'trailing') }
}
