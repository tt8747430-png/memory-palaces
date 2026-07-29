import { type Question, type QuestionChanges, updateQuestion } from '@/entities/question'
import { collectionCommands } from '@/shared/lib'

const commands = collectionCommands<'questions', Question, QuestionChanges>('questions', {
  label: 'Question',
  update: updateQuestion,
})

export const requireQuestion = commands.require
export const editQuestion = commands.edit
export const deleteQuestion = commands.remove
export const reorderQuestions = commands.reorder
