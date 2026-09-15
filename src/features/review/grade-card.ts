import { type Grade, nowIso, schedule } from '@/shared/lib'
import type { Card, CardStore } from '@/entities/card'
import type { HistoryEntry, HistoryStore } from '@/entities/learning-history'
import { requireCard } from '@/features/card'
import { recordHistory } from '@/features/history'

/** A Card as an answer left it, with the history entry that answer wrote. */
export interface AnsweredCard {
  card: Card
  entry: HistoryEntry
}

/**
 * The learner graded a Card under Spaced repetition: the Card moves, and the Grade goes on the
 * Learning history. Both, because the Card only ever carries where its schedule stands *now* —
 * `schedule()` cannot be run backwards, so an answer not recorded here is an answer gone.
 *
 * The entry comes back so an undo can name the row it takes off, rather than searching the store
 * for "the newest one" — a search that reads a mirror the write has not reached yet.
 */
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
        // Absent, not zero, when the Card had no schedule: that is what tells a first review from
        // an answer after a lapse, which `schedule()` also leaves at interval 0.
        intervalBefore: existing.srs?.interval,
        intervalAfter: srs.interval,
        dueAfter: srs.due,
      },
      now,
    ),
  ])
  return { card: updated, entry }
}
