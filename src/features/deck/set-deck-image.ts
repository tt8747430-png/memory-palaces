import type { StoragePort } from '@/shared/api'
import type { Deck, DeckStore } from '@/entities/deck'
import { uploadInlineImage } from '@/shared/lib'
import { editDeck } from './deck-commands'

export interface SetDeckImageDeps {
  store: DeckStore
  storage: StoragePort
  /** Null for a guest, or with no cloud configured — the cover then stays inline. */
  userId: string | null
}

/**
 * Sets a deck's cover. The picked image is saved inline first so the deck looks right immediately
 * and offline, then moved into storage and the hosted URL patched in. A failed upload leaves the
 * inline copy in place; `reconcileInlineImages` retries it once there is a network again.
 *
 * Passing null clears the cover.
 */
export async function setDeckImage(
  { store, storage, userId }: SetDeckImageDeps,
  deckId: string,
  dataUrl: string | null,
): Promise<Deck> {
  const saved = await editDeck(store, deckId, { image: dataUrl ?? undefined })
  if (!userId) return saved

  if (!dataUrl) {
    // Nothing references the object once the deck stops pointing at it, so it should not linger.
    await storage.remove('deck-images', `${userId}/${deckId}`).catch(() => {})
    return saved
  }

  const url = await uploadInlineImage(storage, {
    bucket: 'deck-images',
    path: `${userId}/${deckId}`,
    dataUrl,
  })
  return url ? await editDeck(store, deckId, { image: url }) : saved
}
