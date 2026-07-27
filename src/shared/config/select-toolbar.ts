import { type SwipeAccent } from './swipe'

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
  accent: SwipeAccent
  destructive?: boolean
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

export const SELECT_ACTIONS: Record<SelectSurface, readonly SelectActionId[]> = {
  library: ['move', 'favorite', 'duplicate', 'archive', 'unfile', 'delete'],
  card: ['flag', 'known', 'reset', 'duplicate', 'delete'],
  question: ['duplicate', 'delete'],
}

export const SELECT_TOOLBAR_MAX = 4

export type SelectToolbarConfig = SelectActionId[]

export type SelectToolbarPreferences = Record<SelectSurface, SelectToolbarConfig>

export const DEFAULT_SELECT_TOOLBAR: SelectToolbarPreferences = {
  library: ['move', 'archive', 'delete'],
  card: ['flag', 'known', 'reset', 'delete'],
  question: ['duplicate', 'delete'],
}

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
