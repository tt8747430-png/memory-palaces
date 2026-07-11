import type { Card, CardStore } from '@/entities/card'
import { createCard } from '@/features/card'
import type { TransferStrategy } from './model'

/** Command — parse text in the given format and create a card per row in the deck.
 * Reuses the single-card write-path, so the same invariants apply. */
export async function importCards(
  store: CardStore,
  deckId: string,
  text: string,
  strategy: TransferStrategy,
): Promise<Card[]> {
  const drafts = strategy.parse(text)
  const created: Card[] = []
  for (const draft of drafts) {
    created.push(await createCard(store, deckId, draft))
  }
  return created
}
