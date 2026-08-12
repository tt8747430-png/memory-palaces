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

/**
 * Moves any image still living inside a document into storage.
 *
 * A photo picked offline is saved inline so it works immediately, which leaves base64 travelling
 * through replication until something moves it out. That something is this: it runs when sync
 * starts, so the first connected moment after an offline session cleans up everything that piled
 * up. Anything that still fails simply stays inline and is retried next time.
 */
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
