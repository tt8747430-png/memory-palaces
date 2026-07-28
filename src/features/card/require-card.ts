import { requireEntity } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'

export function requireCard(store: CardStore, id: string): Card {
  return requireEntity(store.getState().cards, id, 'Card')
}
