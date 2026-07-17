import type { Card } from '@app/decks/model/card'
import type { CardStore } from '@app/decks/data/stores'

export function requireCard(store: CardStore, id: string): Card {
  const card = store.cards().find((candidate) => candidate.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}
