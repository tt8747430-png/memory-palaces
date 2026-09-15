import { type Grade, nowIso, schedule } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'
import type { HistoryEntry, HistoryStore } from '@/entities/learning-history'
import { requireCard } from '@/features/card'
import { recordHistory } from '@/features/history'

export interface AnsweredCard {
  card: Card
  entry: HistoryEntry
}

export async function gradeCard(
  cards: CardStore,
  history: HistoryStore,
  cardId: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<AnsweredCard> {
  const existing = requireCard(cards, cardId)
  const srs = schedule(existing.srs, grade, now)
  const updated: Card = { ...existing, srs, updatedAt: nowIso(now) }
  const [, entry] = await Promise.all([
    cards.getState().save(updated),
    recordHistory(
      history,
      {
        cardId,
        deckId: existing.deckId,
        kind: 'graded',
        grade,
        intervalBefore: existing.srs?.interval,
        intervalAfter: srs.interval,
        dueAfter: srs.due,
      },
      now,
    ),
  ])
  return { card: updated, entry }
}
