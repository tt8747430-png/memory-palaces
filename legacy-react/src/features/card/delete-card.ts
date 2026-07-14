import type { CardStore } from '@/entities/card'

export async function deleteCard(store: CardStore, id: string): Promise<void> {
  await store.getState().remove(id)
}
