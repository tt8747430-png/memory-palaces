import type { Entity } from '@/shared/domain'

export interface Question extends Entity {
  deckId: string
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
  order: number
}

export interface MakeQuestionInput {
  id: string
  createdAt: string
  deckId: string
  prompt: string
  options: string[]
  correctAnswer: number
  explanation?: string
  order?: number
}

export function makeQuestion(input: MakeQuestionInput): Question {
  const prompt = input.prompt.trim()
  if (!input.deckId) throw new Error('Question must belong to a deck')
  if (!prompt) throw new Error('Question prompt is required')
  if (input.options.length < 2) throw new Error('Question needs at least two options')
  if (input.correctAnswer < 0 || input.correctAnswer >= input.options.length) {
    throw new Error('correctAnswer must index an option')
  }
  const order = input.order ?? 0
  if (order < 0) throw new Error('Question order must be >= 0')
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    deckId: input.deckId,
    prompt,
    options: [...input.options],
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    order,
  }
}

export type QuestionChanges = Partial<Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'deckId'>>

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
  if (next.order < 0) throw new Error('Question order must be >= 0')
  return { ...next, prompt, options: [...next.options] }
}

export const questionsForDeck = (questions: Question[], deckId: string): Question[] =>
  questions.filter((question) => question.deckId === deckId)
