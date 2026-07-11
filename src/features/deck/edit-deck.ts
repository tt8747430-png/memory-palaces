import { type Deck, type DeckChanges, type DeckStore, updateDeck } from '@/entities/deck'
import { requireDeck } from './require-deck'

/** Command — edit a deck. Applies the changes through the entity's invariant check and
 * persists; the reactive store reflects the result. */
export async function editDeck(store: DeckStore, id: string, changes: DeckChanges): Promise<Deck> {
  const existing = requireDeck(store, id)
  const updated = updateDeck(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
