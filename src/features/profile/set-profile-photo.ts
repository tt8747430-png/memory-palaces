import type { StoragePort } from '@/shared/api'
import type { Profile, ProfileStore } from '@/entities/profile'
import { uploadInlineImage } from '@/shared/lib'
import { PROFILE_ID, setProfile } from './set-profile'

export interface SetProfilePhotoDeps {
  store: ProfileStore
  storage: StoragePort
  /** Null for a guest, or when no cloud is configured — the photo then stays inline. */
  userId: string | null
}

/**
 * Saves the picked photo immediately as an inline data URL, then tries to move it to storage and
 * patch in the hosted URL. The save never waits on the network: offline, the profile keeps a
 * perfectly good local image and syncs it inside the document, and `reconcileInlineImages` moves it
 * out once there is a network again.
 */
export async function setProfilePhoto(
  { store, storage, userId }: SetProfilePhotoDeps,
  dataUrl: string,
  now: number = Date.now(),
): Promise<Profile> {
  const saved = await setProfile(store, { avatar: dataUrl }, now)
  if (!userId) return saved

  const url = await uploadInlineImage(storage, {
    bucket: 'avatars',
    path: `${userId}/${PROFILE_ID}`,
    dataUrl,
  })
  return url ? await setProfile(store, { avatar: url }, now) : saved
}
