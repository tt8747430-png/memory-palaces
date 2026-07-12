import type { Card, CardStore } from '@/entities/card'

export function requireCard(store: CardStore, id: string): Card {
  const card = store.getState().cards.find((candidate) => candidate.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}
