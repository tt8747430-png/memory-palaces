/**
 * The swipe-gesture vocabulary, shared by the list surfaces (which run the gestures) and the
 * settings screen (which lets the user re-map them). Pure data — no React, no icons — so it
 * can sit in `shared/config` and be imported anywhere. Icons + handlers are bound in the UI
 * layer; tone + label key travel with the id here.
 */

/** The kinds of row a swipe can be configured for. Each carries its own action menu because
 * the available actions differ (a deck archives, a card flags). */
export type SwipeItemType = 'deck' | 'folder' | 'card'

export const SWIPE_ITEM_TYPES: readonly SwipeItemType[] = ['deck', 'folder', 'card']

/** Every action a swipe can be bound to, across all item types. The union is flat so the
 * stored config is just a list of ids; {@link SWIPE_ACTIONS} says which apply to which type. */
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

/** Visual register of a revealed action — drives its tint and, for `danger`, the confirm. */
export type SwipeTone = 'danger' | 'warning' | 'success' | 'neutral' | 'accent'

export interface SwipeActionMeta {
  id: SwipeActionId
  /** i18n key for the caption (resolved in the UI). */
  labelKey: string
  tone: SwipeTone
}

/** The action catalog, keyed by id. The label key is resolved with `t()` at render. */
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

/** Which actions each item type can offer, in menu order. The settings screen lists these as
 * the pool the user assigns to a side. */
export const SWIPE_ACTIONS: Record<SwipeItemType, readonly SwipeActionId[]> = {
  deck: ['favorite', 'move', 'archive', 'settings', 'duplicate', 'delete'],
  folder: ['edit', 'delete'],
  card: ['flag', 'known', 'reset', 'duplicate', 'delete'],
}

/**
 * A row's two action trays. `leading` is revealed by swiping the row to the RIGHT (the tray
 * sits on the left edge); `trailing` by swiping LEFT (tray on the right edge). The
 * EDGE-MOST action in each tray is the one a full swipe auto-fires — for `leading` that's
 * index 0 (far left), for `trailing` the last index (far right). An empty tray disables that
 * direction.
 */
export interface SwipeConfig {
  leading: SwipeActionId[]
  trailing: SwipeActionId[]
}

export type SwipePreferences = Record<SwipeItemType, SwipeConfig>

/** Sensible out-of-the-box mapping: the destructive action sits at the trailing edge (the
 * iOS-Mail home for "delete"), a lighter positive action on the leading edge. */
export const DEFAULT_SWIPE: SwipePreferences = {
  deck: { leading: ['favorite'], trailing: ['archive', 'delete'] },
  folder: { leading: ['edit'], trailing: ['delete'] },
  card: { leading: ['known'], trailing: ['flag', 'delete'] },
}

/** Drop ids no longer offered for a type (config authored against an older catalog), and cap
 * each side at two so a tray never overflows a phone row. */
export function normalizeSwipeConfig(type: SwipeItemType, config: SwipeConfig): SwipeConfig {
  const allowed = new Set(SWIPE_ACTIONS[type])
  const clean = (ids: SwipeActionId[]) => ids.filter((id) => allowed.has(id)).slice(0, 2)
  return { leading: clean(config.leading), trailing: clean(config.trailing) }
}
