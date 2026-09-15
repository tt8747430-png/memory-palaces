import type { StoragePort } from '@/shared/api'
import type { Profile, ProfileStore } from '@/entities/profile'
import { uploadInlineImage } from '@/shared/lib'
import { PROFILE_ID, setProfile } from './set-profile'

export interface SetProfilePhotoDeps {
  store: ProfileStore
  storage: StoragePort
  userId: string | null
}

export async function setProfilePhoto(
  { store, storage, userId }: SetProfilePhotoDeps,
  dataUrl: string,
  now: number = Date.now(),
): Promise<Profile> {
  const saved = await setProfile(store, { avatar: dataUrl }, now)
  if (!userId) return saved

  const path = await uploadInlineImage(
    storage,
    { bucket: 'avatars', userId, entityId: PROFILE_ID },
    dataUrl,
  )
  return path ? await setProfile(store, { avatar: path }, now) : saved
}
