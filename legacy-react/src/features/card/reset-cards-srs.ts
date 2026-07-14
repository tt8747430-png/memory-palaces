import { type CardStore, updateCard } from '@/entities/card'

export async function resetCardsSrs(store: CardStore, ids: ReadonlyArray<string>): Promise<void> {
  const updatedAt = new Date().toISOString()
  const targets = new Set(ids)
  const cards = store.getState().cards.filter((card) => targets.has(card.id))
  await Promise.all(
    cards.map((card) => store.getState().save(updateCard(card, { srs: undefined }, updatedAt))),
  )
}
