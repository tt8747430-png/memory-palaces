import { makeProfile, updateProfile } from '@/auth/model/profile'
import type { Profile, ProfileChanges } from '@/auth/model/profile'
import type { ProfileStore } from '@/auth/data/stores'

export const PROFILE_ID = 'profile'

function currentProfile(store: ProfileStore, now: number): Profile {
  return store.profile() ?? makeProfile({ id: PROFILE_ID, createdAt: new Date(now).toISOString() })
}

export async function setProfile(
  store: ProfileStore,
  changes: ProfileChanges,
  now: number = Date.now(),
): Promise<Profile> {
  const base = currentProfile(store, now)
  const updated = updateProfile(base, changes, new Date(now).toISOString())
  await store.save(updated)
  return updated
}
