import type { QuestionStore } from '@/decks/data/stores'
import { duplicateQuestion } from './duplicate-question'

/**
 * Duplicate a selection of questions.
 *
 * Sequential: `duplicateQuestion` reads the current question list to place its copy, so
 * duplicating several at once must not interleave.
 */
export async function duplicateQuestions(
  store: QuestionStore,
  ids: readonly string[],
): Promise<void> {
  for (const id of ids) await duplicateQuestion(store, id)
}
