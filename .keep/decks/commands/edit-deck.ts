import { updateDeck } from '@app/decks/model/deck'
import type { Deck, DeckChanges } from '@app/decks/model/deck'
import type { DeckStore } from '@app/decks/data/stores'
import { requireDeck } from './require-deck'

export async function editDeck(store: DeckStore, id: string, changes: DeckChanges): Promise<Deck> {
  const existing = requireDeck(store, id)
  const updated = updateDeck(existing, changes, new Date().toISOString())
  await store.save(updated)
  return updated
}
