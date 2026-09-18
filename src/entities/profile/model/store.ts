import type { StoreApi } from 'zustand/vanilla'
import { createSingletonStore, type PendingChangePort, type SingletonState } from '@/shared/lib'
import type { ProfileRepository } from '@/entities/profile'
import { completeProfile, type Profile } from './types'

export type ProfileState = SingletonState<'profile', Profile>
export type ProfileStore = StoreApi<ProfileState>

export function createProfileStore(
  repo: ProfileRepository,
  pending?: PendingChangePort,
): ProfileStore {
  return createSingletonStore('profile', repo, completeProfile, pending)
}
