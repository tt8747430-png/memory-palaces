import { createStoreContext } from '@/shared/lib'
import type { PreferencesState } from './store'

const { StoreContext, useSelector, useStoreApi, useStoreApiOptional } =
  createStoreContext<PreferencesState>('Preferences')

export const PreferencesStoreContext = StoreContext
export const usePreferencesStore = useSelector
export const usePreferencesStoreApi = useStoreApi
export const usePreferencesStoreApiOptional = useStoreApiOptional
