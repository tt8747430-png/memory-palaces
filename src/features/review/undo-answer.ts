import type { Card, CardStore, PriorAnswer } from '@/entities/card'
import type { HistoryStore } from '@/entities/learning-history'
import { restoreAnswer } from './restore-answer'

export async function undoAnswer(
  cards: CardStore,
  history: HistoryStore,
  cardId: string,
  prior: PriorAnswer,
  entryId: string | undefined,
  now: number = Date.now(),
): Promise<Card> {
  const [restored] = await Promise.all([
    restoreAnswer(cards, cardId, prior, now),
    entryId ? history.getState().remove(entryId) : undefined,
  ])
  return restored
}
