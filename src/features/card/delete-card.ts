import type { CardStore } from '@/entities/card'

/** Command — delete a card. Idempotent (removing a missing card is a no-op). */
export async function deleteCard(store: CardStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
