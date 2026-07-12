import { type Deck, type DeckChanges, type DeckStore, updateDeck } from '@/entities/deck'
import { requireDeck } from './require-deck'

export async function editDeck(store: DeckStore, id: string, changes: DeckChanges): Promise<Deck> {
  const existing = requireDeck(store, id)
  const updated = updateDeck(existing, changes, new Date().toISOString())
  await store.getState().save(updated)
  return updated
}
