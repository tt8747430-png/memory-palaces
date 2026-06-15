import type { Question } from './types'
import type { QuestionState } from './store'

export const selectQuestions = (state: QuestionState): Question[] => state.questions
export const selectIsReady = (state: QuestionState): boolean => state.status === 'ready'

/** Pure: the questions of one room, in creation order. Compose in a component with
 * `useMemo(() => questionsForRoom(questions, roomId), [questions, roomId])`. */
export const questionsForRoom = (questions: Question[], roomId: string): Question[] =>
  questions.filter((question) => question.roomId === roomId)
