import type { StoragePort } from '@/shared/api'
import type { Deck, DeckStore } from '@/entities/deck'
import { uploadInlineImage } from '@/shared/lib'
import { editDeck } from './deck-commands'

export interface SetDeckImageDeps {
  store: DeckStore
  storage: StoragePort
  userId: string | null
}

export async function setDeckImage(
  { store, storage, userId }: SetDeckImageDeps,
  deckId: string,
  dataUrl: string | null,
): Promise<Deck> {
  const saved = await editDeck(store, deckId, { image: dataUrl ?? undefined })
  if (!userId) return saved
  const ref = { bucket: 'deck-images', userId, entityId: deckId } as const

  if (!dataUrl) {
    await storage.remove(ref).catch(() => {})
    return saved
  }

  const path = await uploadInlineImage(storage, ref, dataUrl)
  return path ? await editDeck(store, deckId, { image: path }) : saved
}
