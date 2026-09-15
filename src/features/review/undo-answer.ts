import type { Card, CardStore, PriorAnswer } from '@/entities/card'
import type { HistoryStore } from '@/entities/learning-history'
import { restoreAnswer } from './restore-answer'

/**
 * Take the last answer back: the Card returns to the state it was in, and the answer comes off the
 * Learning history with it. A history that kept an answer the learner undid would be a record of
 * something that did not happen.
 *
 * `entryId` is the row `gradeCard`/`answerCard` wrote, carried here by the caller rather than
 * looked up. Searching the store for "this Card's newest entry" would read a mirror that lags its
 * own writes — `RxdbRepository.observe` emits off `collection.find().$`, asynchronously after the
 * upsert — so a fast enough undo removed the previous answer and left the undone one standing.
 * Undefined means the action being undone wrote no entry.
 */
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
