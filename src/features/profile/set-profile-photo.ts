import type { StoragePort } from '@/shared/api'
import type { Profile, ProfileStore } from '@/entities/profile'
import { dataUrlToBlob } from '@/shared/lib'
import { PROFILE_ID, setProfile } from './set-profile'

export interface SetProfilePhotoDeps {
  store: ProfileStore
  storage: StoragePort
  /** Null for a guest, or when no cloud is configured — the photo then stays inline forever. */
  userId: string | null
}

/**
 * Saves the picked photo immediately as an inline data URL, then tries to move it to storage and
 * patch in the hosted URL. The save never waits on the network: offline, the profile keeps a
 * perfectly good local image and syncs it inside the document; the upload is retried the next time
 * a photo is saved.
 */
export async function setProfilePhoto(
  { store, storage, userId }: SetProfilePhotoDeps,
  dataUrl: string,
  now: number = Date.now(),
): Promise<Profile> {
  const saved = await setProfile(store, { avatar: dataUrl }, now)
  if (!userId || !dataUrl.startsWith('data:')) return saved

  try {
    const file = dataUrlToBlob(dataUrl)
    const { url } = await storage.upload({
      bucket: 'avatars',
      path: `${userId}/${PROFILE_ID}`,
      file,
      contentType: file.type,
    })
    return await setProfile(store, { avatar: url }, now)
  } catch {
    return saved
  }
}
