import type { StoreApi } from 'zustand/vanilla'
import { createSingletonStore, type SingletonState } from '@/shared/lib'
import type { ProfileRepository } from '@/entities/profile'
import type { Profile } from './types'

export type ProfileState = SingletonState<'profile', Profile>
export type ProfileStore = StoreApi<ProfileState>

export function createProfileStore(repo: ProfileRepository): ProfileStore {
  return createSingletonStore('profile', repo)
}
