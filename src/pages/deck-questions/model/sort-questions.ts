import type { Question } from '@/entities/question'
import { type ContentSort, sortContent } from '@/shared/lib'

export const QUESTION_SORTS = ['manual', 'recent', 'name'] as const satisfies readonly ContentSort[]

export type QuestionSort = (typeof QUESTION_SORTS)[number]

export const sortQuestions = (questions: Question[], sort: QuestionSort): Question[] =>
  sortContent(questions, sort, (question) => question.prompt)
