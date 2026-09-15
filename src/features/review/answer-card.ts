import type { CardStore, FastOutcome } from '@/entities/card'
import type { HistoryStore } from '@/entities/learning-history'
import { requireCard, setCardFastReview } from '@/features/card'
import { recordHistory } from '@/features/history'
import type { AnsweredCard } from './grade-card'

export async function answerCard(
  cards: CardStore,
  history: HistoryStore,
  cardId: string,
  outcome: FastOutcome,
  now: number = Date.now(),
): Promise<AnsweredCard> {
  const { deckId } = requireCard(cards, cardId)
  const [card, entry] = await Promise.all([
    setCardFastReview(cards, cardId, outcome, now),
    recordHistory(history, { cardId, deckId, kind: 'answered', outcome }, now),
  ])
  return { card, entry }
}
