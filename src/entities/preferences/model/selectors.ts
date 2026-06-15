import type { Preferences } from './types'
import { DEFAULT_PREFERENCES } from './types'
import type { PreferencesState } from './store'

export const selectPreferences = (state: PreferencesState): Preferences | null => state.preferences
export const selectIsReady = (state: PreferencesState): boolean => state.status === 'ready'

/** The effective preferences: the saved record, or the defaults until one exists. */
export const selectEffectivePreferences = (
  state: PreferencesState,
): Pick<Preferences, keyof typeof DEFAULT_PREFERENCES> => state.preferences ?? DEFAULT_PREFERENCES
