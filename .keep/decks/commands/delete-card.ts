import type { CardStore } from '@app/decks/data/stores'

export async function deleteCard(store: CardStore, id: string): Promise<void> {
  await store.remove(id)
}
