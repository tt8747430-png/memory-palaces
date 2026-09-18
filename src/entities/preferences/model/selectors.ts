import type { Preferences } from './types'
import { DEFAULT_PREFERENCES } from './types'
import type { PreferencesState } from './store'

export const selectEffectivePreferences = (
  state: PreferencesState,
): Pick<Preferences, keyof typeof DEFAULT_PREFERENCES> => state.preferences ?? DEFAULT_PREFERENCES

export const selectDevMode = (state: PreferencesState): boolean =>
  selectEffectivePreferences(state).devMode

export const selectAutosync = (state: PreferencesState): boolean =>
  selectEffectivePreferences(state).autosync

export const selectLibraryExpanded = (state: PreferencesState): readonly string[] =>
  selectEffectivePreferences(state).libraryExpanded
