import {
  makeQuestion,
  questionsForRoom,
  selectQuestions,
  type Question,
  type QuestionStore,
} from '@/entities/question'
import { nextOrder } from '@/shared/lib'

export interface CreateQuestionInput {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

/** Command — add a question to a room. The single write-path (UI + future Tutor); new
 * questions append to the end of the room's order. */
export async function createQuestion(
  store: QuestionStore,
  roomId: string,
  input: CreateQuestionInput,
): Promise<Question> {
  const order = nextOrder(questionsForRoom(selectQuestions(store.getState()), roomId))
  const question = makeQuestion({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roomId,
    order,
  })
  await store.getState().save(question)
  return question
}
