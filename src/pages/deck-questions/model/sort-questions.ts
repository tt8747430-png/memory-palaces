import type { Question } from '@/entities/question'

export type QuestionSort = 'manual' | 'recent' | 'name'

/** `manual` is the stored order, so it is the one sort that returns the list untouched. */
export function sortQuestions(questions: Question[], sort: QuestionSort): Question[] {
  switch (sort) {
    case 'name':
      return [...questions].sort((a, b) => a.prompt.localeCompare(b.prompt))
    case 'recent':
      return [...questions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'manual':
      return questions
  }
}
