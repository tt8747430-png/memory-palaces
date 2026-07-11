import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import {
  createQuestionStore,
  type Question,
  questionsForDeck,
  selectQuestions,
} from '@/entities/question'
import { createQuestion } from './create-question'
import { editQuestion } from './edit-question'
import { deleteQuestion } from './delete-question'
import { reorderQuestions } from './reorder-questions'
import { duplicateQuestion } from './duplicate-question'

function startedStore() {
  const store = createQuestionStore(new InMemoryRepository<Question>())
  store.getState().start()
  return store
}

const makeQ = (store: ReturnType<typeof startedStore>, prompt: string) =>
  createQuestion(store, 'r1', { prompt, options: ['a', 'b'], correctAnswer: 0 })

const promptsForRoom = (store: ReturnType<typeof startedStore>) =>
  questionsForDeck(selectQuestions(store.getState()), 'r1').map((q) => q.prompt)

describe('createQuestion', () => {
  it('creates a question under a deck', async () => {
    const store = startedStore()

    const question = await createQuestion(store, 'r1', {
      prompt: '  Capital of France?  ',
      options: ['Paris', 'Lyon'],
      correctAnswer: 0,
    })

    expect(question.deckId).toBe('r1')
    expect(question.prompt).toBe('Capital of France?')
    expect(question.options).toEqual(['Paris', 'Lyon'])
    expect(store.getState().questions).toHaveLength(1)
  })

  it('rejects fewer than two options or an out-of-range answer', async () => {
    const store = startedStore()
    await expect(
      createQuestion(store, 'r1', { prompt: 'q', options: ['only'], correctAnswer: 0 }),
    ).rejects.toThrow(/option/i)
    await expect(
      createQuestion(store, 'r1', { prompt: 'q', options: ['a', 'b'], correctAnswer: 5 }),
    ).rejects.toThrow(/correctAnswer/i)
  })
})

describe('editQuestion', () => {
  it('updates fields while preserving id and room', async () => {
    const store = startedStore()
    const question = await createQuestion(store, 'r1', {
      prompt: 'old',
      options: ['a', 'b'],
      correctAnswer: 0,
    })

    const edited = await editQuestion(store, question.id, {
      prompt: 'new',
      correctAnswer: 1,
      explanation: 'because',
    })

    expect(edited.id).toBe(question.id)
    expect(edited.deckId).toBe('r1')
    expect(edited.prompt).toBe('new')
    expect(edited.correctAnswer).toBe(1)
    expect(edited.explanation).toBe('because')
  })

  it('rejects an answer index outside the options', async () => {
    const store = startedStore()
    const question = await createQuestion(store, 'r1', {
      prompt: 'q',
      options: ['a', 'b'],
      correctAnswer: 0,
    })
    await expect(editQuestion(store, question.id, { correctAnswer: 9 })).rejects.toThrow(
      /correctAnswer/i,
    )
  })

  it('throws when the question does not exist', async () => {
    const store = startedStore()
    await expect(editQuestion(store, 'missing', { prompt: 'x' })).rejects.toThrow(/not found/i)
  })
})

describe('deleteQuestion', () => {
  it('removes the question', async () => {
    const store = startedStore()
    const question = await createQuestion(store, 'r1', {
      prompt: 'q',
      options: ['a', 'b'],
      correctAnswer: 0,
    })
    await deleteQuestion(store, question.id)
    expect(store.getState().questions).toEqual([])
  })
})

describe('reorderQuestions', () => {
  it('writes each question its index in the supplied order and renumbers the deck', async () => {
    const store = startedStore()
    const a = await makeQ(store, 'a')
    const b = await makeQ(store, 'b')
    const c = await makeQ(store, 'c')

    await reorderQuestions(store, [c.id, a.id, b.id])

    expect(promptsForRoom(store)).toEqual(['c', 'a', 'b'])
    const byPrompt = (prompt: string) =>
      store.getState().questions.find((q) => q.prompt === prompt)!
    expect(byPrompt('c').order).toBe(0)
    expect(byPrompt('a').order).toBe(1)
    expect(byPrompt('b').order).toBe(2)
  })
})

describe('duplicateQuestion', () => {
  it('copies a question into a fresh one appended to the deck', async () => {
    const store = startedStore()
    const a = await makeQ(store, 'a')
    const copy = await duplicateQuestion(store, a.id)
    expect(copy.id).not.toBe(a.id)
    expect(copy.prompt).toBe('a')
    expect(promptsForRoom(store)).toEqual(['a', 'a'])
  })
})
