import type { Preferences } from './types'
import { DEFAULT_PREFERENCES } from './types'
import type { PreferencesState } from './store'

export const selectPreferences = (state: PreferencesState): Preferences | null => state.preferences
export const selectIsReady = (state: PreferencesState): boolean => state.status === 'ready'

export const selectEffectivePreferences = (
  state: PreferencesState,
): Pick<Preferences, keyof typeof DEFAULT_PREFERENCES> => state.preferences ?? DEFAULT_PREFERENCES
