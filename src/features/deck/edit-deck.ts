import { type Deck, type DeckChanges, type DeckStore, updateDeck } from '@/entities/deck'
import { requireDeck } from './require-deck'
import { nowIso } from '@/shared/lib'

export async function editDeck(store: DeckStore, id: string, changes: DeckChanges): Promise<Deck> {
  const existing = requireDeck(store, id)
  const updated = updateDeck(existing, changes, nowIso())
  await store.getState().save(updated)
  return updated
}
