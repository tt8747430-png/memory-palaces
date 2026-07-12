export type SwipeItemType = 'deck' | 'folder' | 'card'

export const SWIPE_ITEM_TYPES: readonly SwipeItemType[] = ['deck', 'folder', 'card']

export type SwipeActionId =
  | 'favorite'
  | 'move'
  | 'archive'
  | 'settings'
  | 'edit'
  | 'addSubdeck'
  | 'addDeck'
  | 'duplicate'
  | 'reset'
  | 'flag'
  | 'known'
  | 'delete'

/** Named accent per swipe action — 10 distinct hues spread around the wheel,
 *  so every action reads as its own thing instead of one of five muddy tones.
 *  Each maps to a `--sw-*` token; `ink` is the text color over the solid fill. */
export type SwipeAccent =
  | 'rose'
  | 'plum'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'teal'
  | 'emerald'
  | 'gold'
  | 'red'
  | 'slate'

export const SWIPE_ACCENT: Record<SwipeAccent, { fill: string; ink: 'light' | 'dark' }> = {
  rose: { fill: 'var(--sw-rose)', ink: 'light' },
  plum: { fill: 'var(--sw-plum)', ink: 'light' },
  violet: { fill: 'var(--sw-violet)', ink: 'light' },
  indigo: { fill: 'var(--sw-indigo)', ink: 'light' },
  blue: { fill: 'var(--sw-blue)', ink: 'light' },
  teal: { fill: 'var(--sw-teal)', ink: 'light' },
  emerald: { fill: 'var(--sw-emerald)', ink: 'light' },
  gold: { fill: 'var(--sw-gold)', ink: 'dark' },
  red: { fill: 'var(--sw-red)', ink: 'light' },
  slate: { fill: 'var(--sw-slate)', ink: 'light' },
}

export interface SwipeActionMeta {
  id: SwipeActionId
  labelKey: string
  accent: SwipeAccent
}

export const SWIPE_ACTION_META: Record<SwipeActionId, SwipeActionMeta> = {
  favorite: { id: 'favorite', labelKey: 'swipe.actions.favorite', accent: 'rose' },
  move: { id: 'move', labelKey: 'swipe.actions.move', accent: 'indigo' },
  archive: { id: 'archive', labelKey: 'swipe.actions.archive', accent: 'teal' },
  settings: { id: 'settings', labelKey: 'swipe.actions.settings', accent: 'slate' },
  edit: { id: 'edit', labelKey: 'swipe.actions.edit', accent: 'blue' },
  addSubdeck: { id: 'addSubdeck', labelKey: 'swipe.actions.addSubdeck', accent: 'emerald' },
  addDeck: { id: 'addDeck', labelKey: 'swipe.actions.addDeck', accent: 'emerald' },
  duplicate: { id: 'duplicate', labelKey: 'swipe.actions.duplicate', accent: 'violet' },
  reset: { id: 'reset', labelKey: 'swipe.actions.reset', accent: 'plum' },
  flag: { id: 'flag', labelKey: 'swipe.actions.flag', accent: 'gold' },
  known: { id: 'known', labelKey: 'swipe.actions.known', accent: 'emerald' },
  delete: { id: 'delete', labelKey: 'swipe.actions.delete', accent: 'red' },
}

/** Every action reachable per item type — the full editor palette. There is no
 *  long-press quick sheet anymore, so swipe is the single per-row action surface. */
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

/** Trailing (swipe-left) is the primary side and reaches the screen edge, so it
 *  holds more actions than leading (swipe-right). */
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
