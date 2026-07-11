import { cloneEntity } from '@/shared/lib'
import type { Deck, DeckStore } from '@/entities/deck'
import { requireDeck } from './require-deck'

/** Command — duplicate a deck (Prototype). Deep-clones the deck node with a fresh identity +
 * timestamps and a "(copy)" name; a subdeck/card cascade is a later, deeper concern. */
export async function duplicateDeck(store: DeckStore, id: string): Promise<Deck> {
  const original = requireDeck(store, id)
  const copy: Deck = {
    ...cloneEntity(original, crypto.randomUUID(), new Date().toISOString()),
    name: `${original.name} (copy)`,
  }
  await store.getState().save(copy)
  return copy
}
