import { cloneEntity } from '@/shared/lib'
import type { Deck, DeckStore } from '@/entities/deck'
import { requireDeck } from './require-deck'

export async function duplicateDeck(store: DeckStore, id: string): Promise<Deck> {
  const original = requireDeck(store, id)
  const copy: Deck = {
    ...cloneEntity(original, crypto.randomUUID(), new Date().toISOString()),
    name: `${original.name} (copy)`,
  }
  await store.getState().save(copy)
  return copy
}
