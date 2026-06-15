import { makeQuestion, type Question, type QuestionStore } from '@/entities/question'

export interface CreateQuestionInput {
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

/** Command — add a question to a room. The single write-path (UI + future Tutor). */
export async function createQuestion(
  store: QuestionStore,
  roomId: string,
  input: CreateQuestionInput,
): Promise<Question> {
  const question = makeQuestion({
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roomId,
  })
  await store.getState().save(question)
  return question
}
