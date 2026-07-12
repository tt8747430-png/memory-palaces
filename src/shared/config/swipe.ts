export type SwipeItemType = 'deck' | 'folder' | 'card'

export const SWIPE_ITEM_TYPES: readonly SwipeItemType[] = ['deck', 'folder', 'card']

export type SwipeActionId =
  | 'favorite'
  | 'move'
  | 'archive'
  | 'settings'
  | 'edit'
  | 'duplicate'
  | 'reset'
  | 'flag'
  | 'known'
  | 'delete'

export type SwipeTone = 'danger' | 'warning' | 'success' | 'neutral' | 'accent'

export interface SwipeActionMeta {
  id: SwipeActionId
  labelKey: string
  tone: SwipeTone
}

export const SWIPE_ACTION_META: Record<SwipeActionId, SwipeActionMeta> = {
  favorite: { id: 'favorite', labelKey: 'swipe.actions.favorite', tone: 'accent' },
  move: { id: 'move', labelKey: 'swipe.actions.move', tone: 'neutral' },
  archive: { id: 'archive', labelKey: 'swipe.actions.archive', tone: 'warning' },
  settings: { id: 'settings', labelKey: 'swipe.actions.settings', tone: 'neutral' },
  edit: { id: 'edit', labelKey: 'swipe.actions.edit', tone: 'neutral' },
  duplicate: { id: 'duplicate', labelKey: 'swipe.actions.duplicate', tone: 'neutral' },
  reset: { id: 'reset', labelKey: 'swipe.actions.reset', tone: 'warning' },
  flag: { id: 'flag', labelKey: 'swipe.actions.flag', tone: 'warning' },
  known: { id: 'known', labelKey: 'swipe.actions.known', tone: 'success' },
  delete: { id: 'delete', labelKey: 'swipe.actions.delete', tone: 'danger' },
}

export const SWIPE_ACTIONS: Record<SwipeItemType, readonly SwipeActionId[]> = {
  deck: ['favorite', 'move', 'archive', 'settings', 'duplicate', 'delete'],
  folder: ['edit', 'delete'],
  card: ['flag', 'known', 'reset', 'duplicate', 'delete'],
}

export interface SwipeConfig {
  leading: SwipeActionId[]
  trailing: SwipeActionId[]
}

export type SwipePreferences = Record<SwipeItemType, SwipeConfig>

export const DEFAULT_SWIPE: SwipePreferences = {
  deck: { leading: ['favorite'], trailing: ['archive', 'delete'] },
  folder: { leading: ['edit'], trailing: ['delete'] },
  card: { leading: ['known'], trailing: ['flag', 'delete'] },
}

export function normalizeSwipeConfig(type: SwipeItemType, config: SwipeConfig): SwipeConfig {
  const allowed = new Set(SWIPE_ACTIONS[type])
  const clean = (ids: SwipeActionId[]) => ids.filter((id) => allowed.has(id)).slice(0, 2)
  return { leading: clean(config.leading), trailing: clean(config.trailing) }
}
