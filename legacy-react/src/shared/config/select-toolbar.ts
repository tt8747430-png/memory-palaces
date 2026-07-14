import { type SwipeAccent } from './swipe'

/**
 * The three surfaces that have a multi-select mode. `library` covers the deck
 * tree, where decks and folders are selected together, so one bar serves both.
 */
export type SelectSurface = 'library' | 'card' | 'question'

export const SELECT_SURFACES: readonly SelectSurface[] = ['library', 'card', 'question']

export type SelectActionId =
  | 'move'
  | 'favorite'
  | 'duplicate'
  | 'archive'
  | 'unfile'
  | 'flag'
  | 'known'
  | 'reset'
  | 'delete'

export interface SelectActionMeta {
  id: SelectActionId
  labelKey: string
  /** Only used to tint the chip in the settings editor — the bar itself stays calm. */
  accent: SwipeAccent
  destructive?: boolean
  /** Acts on decks only, so it stays disabled while a folder-only selection is held. */
  decksOnly?: boolean
}

export const SELECT_ACTION_META: Record<SelectActionId, SelectActionMeta> = {
  move: { id: 'move', labelKey: 'select.actions.move', accent: 'indigo', decksOnly: true },
  favorite: {
    id: 'favorite',
    labelKey: 'select.actions.favorite',
    accent: 'rose',
    decksOnly: true,
  },
  duplicate: { id: 'duplicate', labelKey: 'select.actions.duplicate', accent: 'violet' },
  archive: { id: 'archive', labelKey: 'select.actions.archive', accent: 'teal', decksOnly: true },
  unfile: { id: 'unfile', labelKey: 'select.actions.unfile', accent: 'blue', decksOnly: true },
  flag: { id: 'flag', labelKey: 'select.actions.flag', accent: 'gold' },
  known: { id: 'known', labelKey: 'select.actions.known', accent: 'emerald' },
  reset: { id: 'reset', labelKey: 'select.actions.reset', accent: 'plum' },
  delete: { id: 'delete', labelKey: 'select.actions.delete', accent: 'red', destructive: true },
}

/** Every action reachable per surface — the full editor palette. */
export const SELECT_ACTIONS: Record<SelectSurface, readonly SelectActionId[]> = {
  library: ['move', 'favorite', 'duplicate', 'archive', 'unfile', 'delete'],
  card: ['flag', 'known', 'reset', 'duplicate', 'delete'],
  question: ['duplicate', 'delete'],
}

/**
 * The bar is a single row of equal tiles on a 430px column and there is no
 * overflow menu behind it: four is what fits while a label stays readable.
 */
export const SELECT_TOOLBAR_MAX = 4

export type SelectToolbarConfig = SelectActionId[]

export type SelectToolbarPreferences = Record<SelectSurface, SelectToolbarConfig>

export const DEFAULT_SELECT_TOOLBAR: SelectToolbarPreferences = {
  library: ['move', 'archive', 'delete'],
  card: ['flag', 'known', 'reset', 'delete'],
  question: ['duplicate', 'delete'],
}

/**
 * Keeps a stored bar usable: only actions this surface offers, never more than
 * fits, no duplicates — and never empty, because an empty bar would strand a
 * selection with nothing to do.
 */
export function normalizeSelectToolbar(
  surface: SelectSurface,
  config: SelectToolbarConfig | undefined,
): SelectToolbarConfig {
  const allowed = new Set(SELECT_ACTIONS[surface])
  const clean = [...new Set(config ?? [])]
    .filter((id) => allowed.has(id))
    .slice(0, SELECT_TOOLBAR_MAX)
  return clean.length > 0 ? clean : [...DEFAULT_SELECT_TOOLBAR[surface]]
}
