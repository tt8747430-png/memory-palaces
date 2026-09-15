import { type Card, type CardStore, updateCard } from '@/entities/card'
import type { HistoryStore } from '@/entities/learning-history'
import { recordHistory } from '@/features/history'
import { type Grade, nowIso, type SrsState } from '@/shared/lib'
import { requireCard } from './card-commands'

export interface CardProgress {
  /** The schedule to store. `undefined` puts the card back to new. */
  srs: SrsState | undefined
  /** Set when the learner reached this schedule by picking a grade. */
  grade?: Grade
}

/**
 * Writes a schedule the learner set by hand and records it, so an adjustment
 * shows up in the card's learning history beside its answers.
 */
export async function setCardProgress(
  cards: CardStore,
  history: HistoryStore,
  id: string,
  progress: CardProgress,
  now: number = Date.now(),
): Promise<Card> {
  const existing = requireCard(cards, id)
  const updated = updateCard(existing, { srs: progress.srs }, nowIso(now))
  await Promise.all([
    cards.getState().save(updated),
    recordHistory(
      history,
      {
        cardId: id,
        deckId: existing.deckId,
        kind: progress.grade ? 'graded' : 'adjusted',
        grade: progress.grade,
        intervalBefore: existing.srs?.interval,
        intervalAfter: progress.srs?.interval,
        dueAfter: progress.srs?.due,
      },
      now,
    ),
  ])
  return updated
}
