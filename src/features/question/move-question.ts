import {
  questionsForRoom,
  selectQuestions,
  updateQuestion,
  type QuestionStore,
} from '@/entities/question'
import { resequence } from '@/shared/lib'
import { requireQuestion } from './require-question'

export type MoveDirection = 'up' | 'down'

/**
 * Command — reorder a question one step within its room. Swaps with the adjacent question
 * in the displayed order, then resequences so legacy/equal orders normalise. A no-op at
 * the edges; only the questions whose order changed are persisted.
 */
export async function moveQuestion(
  store: QuestionStore,
  id: string,
  direction: MoveDirection,
): Promise<void> {
  const question = requireQuestion(store, id)
  const ordered = questionsForRoom(selectQuestions(store.getState()), question.roomId)
  const index = ordered.findIndex((candidate) => candidate.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= ordered.length) return

  const next = [...ordered]
  ;[next[index], next[target]] = [next[target]!, next[index]!]

  const now = new Date().toISOString()
  await Promise.all(
    resequence(next).map(({ item, order }) =>
      store.getState().save(updateQuestion(item, { order }, now)),
    ),
  )
}
