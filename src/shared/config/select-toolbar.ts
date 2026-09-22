import type { ActionId } from './actions'

export type SelectSurface = 'library' | 'card' | 'question'

export const SELECT_SURFACES: readonly SelectSurface[] = ['library', 'card', 'question']

export type SelectActionId = Extract<
  ActionId,
  | 'move'
  | 'favorite'
  | 'duplicate'
  | 'archive'
  | 'unfile'
  | 'flag'
  | 'known'
  | 'reset'
  | 'style'
  | 'delete'
>

export const SELECT_ACTIONS: Record<SelectSurface, readonly SelectActionId[]> = {
  library: ['move', 'favorite', 'duplicate', 'archive', 'unfile', 'style', 'delete'],
  card: ['move', 'flag', 'known', 'reset', 'duplicate', 'delete'],
  question: ['duplicate', 'delete'],
}

export const SELECT_TOOLBAR_MAX = 4

export type SelectToolbarConfig = SelectActionId[]

/** One more action would still fit on the bar. */
export const selectToolbarHasRoom = (config: SelectToolbarConfig): boolean =>
  config.length < SELECT_TOOLBAR_MAX

/**
 * An action may come off the bar. The bar keeps its last: a selection with nothing on its bar can
 * be neither acted on nor, from the bar, left.
 */
export const selectToolbarCanShrink = (config: SelectToolbarConfig): boolean => config.length > 1

export type SelectToolbarPreferences = Record<SelectSurface, SelectToolbarConfig>

export const DEFAULT_SELECT_TOOLBAR: SelectToolbarPreferences = {
  library: ['move', 'archive', 'delete'],
  card: ['move', 'flag', 'known', 'delete'],
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
