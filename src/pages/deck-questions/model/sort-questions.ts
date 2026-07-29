import type { Question } from '@/entities/question'
import { type ContentSort, sortContent } from '@/shared/lib'

/** A question carries no schedule and no flag, so it offers the sorts it can honour. */
export type QuestionSort = Extract<ContentSort, 'manual' | 'recent' | 'name'>

export const sortQuestions = (questions: Question[], sort: QuestionSort): Question[] =>
  sortContent(questions, sort, (question) => question.prompt)
