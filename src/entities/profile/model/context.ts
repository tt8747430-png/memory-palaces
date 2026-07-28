import { createStoreContext } from '@/shared/lib'
import type { ProfileState } from './store'

const { StoreContext, useSelector, useStoreApi } = createStoreContext<ProfileState>('Profile')

export const ProfileStoreContext = StoreContext
export const useProfileStore = useSelector
export const useProfileStoreApi = useStoreApi
