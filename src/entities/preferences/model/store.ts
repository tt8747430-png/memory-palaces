import type { StoreApi } from 'zustand/vanilla'
import { createSingletonStore, type SingletonState } from '@/shared/lib'
import type { PreferencesRepository } from '@/entities/preferences'
import { completePreferences, type Preferences } from './types'

export type PreferencesState = SingletonState<'preferences', Preferences>
export type PreferencesStore = StoreApi<PreferencesState>

export function createPreferencesStore(repo: PreferencesRepository): PreferencesStore {
  return createSingletonStore('preferences', repo, completePreferences)
}
