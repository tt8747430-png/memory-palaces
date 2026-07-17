import type { CardStore } from '@/decks/data/stores'

/** Delete a selection of cards. */
export async function deleteCards(store: CardStore, ids: readonly string[]): Promise<void> {
  const targets = new Set(ids)
  await Promise.all([...targets].map((id) => store.remove(id)))
}
