import type { CardStore } from '@/decks/data/stores'

export async function deleteCard(store: CardStore, id: string): Promise<void> {
  await store.remove(id)
}
