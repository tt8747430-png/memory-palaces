export type {
  Preferences,
  PrivacySettings,
  ContentSort,
  StudyMode,
  Theme,
  SwipePreferences,
  FlashcardSwipeConfig,
  FlashcardSwipeByMode,
  FlashcardSwipePreferences,
  MakePreferencesInput,
  PreferencesChanges,
} from './model/types'
export type { ExtensionId } from '@/shared/lib'
export {
  isExtensionEnabled,
  isExtensionFeatureOn,
  withExtensionFeature,
  makePreferences,
  completePreferences,
  updatePreferences,
  resolveStudyMode,
  DEFAULT_PREFERENCES,
  DEFAULT_PRIVACY,
  STUDY_MODES,
} from './model/types'
export { mergePreferences } from './model/merge'
export { createPreferencesStore } from './model/store'
export type { PreferencesState, PreferencesStore } from './model/store'
export {
  PreferencesStoreContext,
  usePreferencesStore,
  usePreferencesStoreApi,
  usePreferencesStoreApiOptional,
} from './model/context'
export {
  selectAutosync,
  selectDeckSort,
  selectDeckSortSubdecks,
  selectDevMode,
  selectDisabledFeatures,
  selectExtensionFeature,
  selectEffectivePreferences,
  selectFlashcardInput,
  selectLibraryExpanded,
} from './model/selectors'
export type { PreferencesRepository } from './api/preferences-repository'
