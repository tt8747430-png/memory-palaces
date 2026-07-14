import { makeProfile, updateProfile } from '@app/auth/model/profile'
import type { Profile, ProfileChanges } from '@app/auth/model/profile'
import type { ProfileStore } from '@app/auth/data/stores'

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
