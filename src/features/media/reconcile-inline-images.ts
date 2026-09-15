import type { StoragePort } from '@/shared/api'
import type { DeckStore } from '@/entities/deck'
import type { ProfileStore } from '@/entities/profile'
import { isInlineImage } from '@/shared/lib'
import { setDeckImage } from '@/features/deck'
import { setProfilePhoto } from '@/features/profile'

export interface ReconcileInlineImagesDeps {
  profileStore: ProfileStore
  deckStore: DeckStore
  storage: StoragePort
  userId: string
}

export async function reconcileInlineImages({
  profileStore,
  deckStore,
  storage,
  userId,
}: ReconcileInlineImagesDeps): Promise<number> {
  let moved = 0

  const avatar = profileStore.getState().profile?.avatar
  if (isInlineImage(avatar)) {
    const after = await setProfilePhoto({ store: profileStore, storage, userId }, avatar)
    if (!isInlineImage(after.avatar)) moved += 1
  }

  for (const deck of deckStore.getState().decks) {
    if (!isInlineImage(deck.image)) continue
    const after = await setDeckImage({ store: deckStore, storage, userId }, deck.id, deck.image)
    if (!isInlineImage(after.image)) moved += 1
  }

  return moved
}
