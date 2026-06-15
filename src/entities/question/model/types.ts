import type { Entity } from '@/shared/lib'

/** A multiple-choice recall question scoped to a room. */
export interface Question extends Entity {
  roomId: string
  prompt: string
  options: string[]
  /** Index into `options` of the correct choice. */
  correctAnswer: number
  explanation?: string
}

export interface MakeQuestionInput {
  id: string
  createdAt: string
  roomId: string
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export function makeQuestion(input: MakeQuestionInput): Question {
  const prompt = input.prompt.trim()
  if (!input.roomId) throw new Error('Question must belong to a room')
  if (!prompt) throw new Error('Question prompt is required')
  if (input.options.length < 2) throw new Error('Question needs at least two options')
  if (input.correctAnswer < 0 || input.correctAnswer >= input.options.length) {
    throw new Error('correctAnswer must index an option')
  }
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    roomId: input.roomId,
    prompt,
    options: [...input.options],
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
  }
}

/** Editable fields of a question — identity, timestamps, and room are owned elsewhere. */
export type QuestionChanges = Partial<Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'roomId'>>

/** Apply an edit, enforcing the same invariants as {@link makeQuestion}. `updatedAt`
 * is set by the caller (clock injected) so the function stays pure. */
export function updateQuestion(
  question: Question,
  changes: QuestionChanges,
  updatedAt: string,
): Question {
  const next = { ...question, ...changes, updatedAt }
  const prompt = next.prompt.trim()
  if (!prompt) throw new Error('Question prompt is required')
  if (next.options.length < 2) throw new Error('Question needs at least two options')
  if (next.correctAnswer < 0 || next.correctAnswer >= next.options.length) {
    throw new Error('correctAnswer must index an option')
  }
  return { ...next, prompt, options: [...next.options] }
}
