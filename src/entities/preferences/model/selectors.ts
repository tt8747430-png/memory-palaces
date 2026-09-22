import type { DeckSort, FlashcardInput, Preferences } from './types'
import { DEFAULT_PREFERENCES } from './types'
import type { PreferencesState } from './store'

export const selectEffectivePreferences = (
  state: PreferencesState,
): Pick<Preferences, keyof typeof DEFAULT_PREFERENCES> => state.preferences ?? DEFAULT_PREFERENCES

export const selectDailyGoal = (state: PreferencesState): number =>
  selectEffectivePreferences(state).dailyGoal

export const selectDevMode = (state: PreferencesState): boolean =>
  selectEffectivePreferences(state).devMode

export const selectAutosync = (state: PreferencesState): boolean =>
  selectEffectivePreferences(state).autosync

export const selectLibraryExpanded = (state: PreferencesState): readonly string[] =>
  selectEffectivePreferences(state).libraryExpanded

export const selectDeckSort = (state: PreferencesState): DeckSort =>
  selectEffectivePreferences(state).deckSort

export const selectDeckSortSubdecks = (state: PreferencesState): boolean =>
  selectEffectivePreferences(state).deckSortSubdecks

/** The stored map, not a copy — a subscriber can compare it by identity. */
export const selectSubdeckSorts = (state: PreferencesState): Readonly<Record<string, DeckSort>> =>
  selectEffectivePreferences(state).subdeckSorts

export const selectFlashcardInput = (state: PreferencesState): FlashcardInput =>
  selectEffectivePreferences(state).flashcardInput

/**
 * The map of switched-off extension features. The stored object, not a copy — a subscriber can
 * compare it by identity, so an unrelated preference write re-renders nothing here.
 */
export const selectDisabledFeatures = (
  state: PreferencesState,
): Readonly<Record<string, string[]>> => selectEffectivePreferences(state).disabledFeatures

/** Whether one of an extension's features is on, for a component that watches just that switch. */
export const selectExtensionFeature =
  (extensionId: string, featureId: string) =>
  (state: PreferencesState): boolean =>
    !selectEffectivePreferences(state).disabledFeatures[extensionId]?.includes(featureId)
