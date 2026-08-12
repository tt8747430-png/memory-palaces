import type { ActionId } from './actions'

export type SelectSurface = 'library' | 'card' | 'question'

export const SELECT_SURFACES: readonly SelectSurface[] = ['library', 'card', 'question']

export type SelectActionId = Extract<
  ActionId,
  'move' | 'favorite' | 'duplicate' | 'archive' | 'unfile' | 'flag' | 'known' | 'reset' | 'delete'
>

export const SELECT_ACTIONS: Record<SelectSurface, readonly SelectActionId[]> = {
  library: ['move', 'favorite', 'duplicate', 'archive', 'unfile', 'delete'],
  card: ['move', 'flag', 'known', 'reset', 'duplicate', 'delete'],
  question: ['duplicate', 'delete'],
}

export const SELECT_TOOLBAR_MAX = 4

export type SelectToolbarConfig = SelectActionId[]

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
