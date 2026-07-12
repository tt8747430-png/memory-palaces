import { makeProfile, type Profile, type ProfileChanges, type ProfileStore, updateProfile, } from '@/entities/profile'

export const PROFILE_ID = 'profile'

function currentProfile(store: ProfileStore, now: number): Profile {
  return (
    store.getState().profile ??
    makeProfile({ id: PROFILE_ID, createdAt: new Date(now).toISOString() })
  )
}

export async function setProfile(
  store: ProfileStore,
  changes: ProfileChanges,
  now: number = Date.now(),
): Promise<Profile> {
  const base = currentProfile(store, now)
  const updated = updateProfile(base, changes, new Date(now).toISOString())
  await store.getState().save(updated)
  return updated
}
