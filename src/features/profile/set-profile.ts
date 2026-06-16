import {
  makeProfile,
  updateProfile,
  type Profile,
  type ProfileChanges,
  type ProfileStore,
} from '@/entities/profile'

/** The one profile record's id — singleton, so a fixed key prevents duplicates. */
export const PROFILE_ID = 'profile'

function currentProfile(store: ProfileStore, now: number): Profile {
  return (
    store.getState().profile ??
    makeProfile({ id: PROFILE_ID, createdAt: new Date(now).toISOString() })
  )
}

/** Command — edit one or more profile fields, creating the singleton record on first
 * use. The single write-path the settings UI uses; `now` is injected for determinism. */
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
