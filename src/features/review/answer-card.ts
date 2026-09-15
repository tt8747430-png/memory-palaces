import type { CardStore, FastOutcome } from '@/entities/card'
import type { HistoryStore } from '@/entities/learning-history'
import { requireCard, setCardFastReview } from '@/features/card'
import { recordHistory } from '@/features/history'
import type { AnsweredCard } from './grade-card'

/**
 * The learner answered a Card under Fast review. The Card keeps only the latest outcome, so without
 * the history a Fast deck has no record at all — and Fast review moves no schedule, which is why
 * the entry carries no intervals.
 */
export async function answerCard(
  cards: CardStore,
  history: HistoryStore,
  cardId: string,
  outcome: FastOutcome,
  now: number = Date.now(),
): Promise<AnsweredCard> {
  // Read before the writes so the two can go out together: `setCardFastReview` looks the Card up
  // again, and only the deck it belongs to is needed here.
  const { deckId } = requireCard(cards, cardId)
  const [card, entry] = await Promise.all([
    setCardFastReview(cards, cardId, outcome, now),
    recordHistory(history, { cardId, deckId, kind: 'answered', outcome }, now),
  ])
  return { card, entry }
}
