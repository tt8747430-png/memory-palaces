import { describe, expect, it } from 'vitest'
import {
  initQuiz,
  quizAccuracy,
  quizReducer,
  type AnsweringState,
  type QuizState,
} from './quiz-machine'

function answering(total: number): AnsweringState {
  const state = initQuiz(total)
  if (state.status !== 'answering') throw new Error('expected an answering quiz')
  return state
}

describe('initQuiz', () => {
  it('starts answering the first question with a clean score', () => {
    expect(initQuiz(3)).toEqual({
      status: 'answering',
      index: 0,
      total: 3,
      selected: null,
      answered: false,
      score: 0,
      streak: 0,
    })
  })

  it('is immediately complete when there are no questions', () => {
    expect(initQuiz(0)).toEqual({ status: 'complete', score: 0, total: 0 })
  })
})

describe('select', () => {
  it('records the chosen option before submitting', () => {
    const next = quizReducer(answering(2), { type: 'select', option: 1 })
    expect(next.status === 'answering' && next.selected).toBe(1)
  })

  it('is locked once the question is answered', () => {
    const answered = quizReducer(
      { ...answering(2), selected: 0, answered: true },
      { type: 'select', option: 1 },
    )
    expect(answered.status === 'answering' && answered.selected).toBe(0)
  })
})

describe('submit', () => {
  it('scores a correct answer and extends the streak', () => {
    const start = { ...answering(2), selected: 1 }
    const next = quizReducer(start, { type: 'submit', correct: true })
    expect(next.status === 'answering' && next.answered).toBe(true)
    expect(next.status === 'answering' && next.score).toBe(1)
    expect(next.status === 'answering' && next.streak).toBe(1)
  })

  it('breaks the streak on a wrong answer without scoring', () => {
    const start = { ...answering(2), selected: 0, score: 1, streak: 3 }
    const next = quizReducer(start, { type: 'submit', correct: false })
    expect(next.status === 'answering' && next.score).toBe(1)
    expect(next.status === 'answering' && next.streak).toBe(0)
    expect(next.status === 'answering' && next.answered).toBe(true)
  })

  it('does nothing until an option is selected', () => {
    const start = answering(2)
    expect(quizReducer(start, { type: 'submit', correct: true })).toBe(start)
  })
})

describe('timeout', () => {
  it('reveals the answer, counts it wrong, and breaks the streak', () => {
    const start = { ...answering(2), streak: 2 }
    const next = quizReducer(start, { type: 'timeout' })
    expect(next.status === 'answering' && next.answered).toBe(true)
    expect(next.status === 'answering' && next.streak).toBe(0)
    expect(next.status === 'answering' && next.score).toBe(0)
  })
})

describe('next', () => {
  it('advances to the next question after feedback', () => {
    const answered: AnsweringState = { ...answering(2), selected: 1, answered: true, score: 1 }
    const next = quizReducer(answered, { type: 'next' })
    expect(next).toEqual({
      status: 'answering',
      index: 1,
      total: 2,
      selected: null,
      answered: false,
      score: 1,
      streak: 0,
    })
  })

  it('completes after the last question, keeping the final score', () => {
    const last: AnsweringState = {
      ...answering(2),
      index: 1,
      selected: 0,
      answered: true,
      score: 2,
    }
    expect(quizReducer(last, { type: 'next' })).toEqual({
      status: 'complete',
      score: 2,
      total: 2,
    })
  })

  it('is a no-op before the current question is answered', () => {
    const start = answering(2)
    expect(quizReducer(start, { type: 'next' })).toBe(start)
  })
})

describe('skip', () => {
  it('advances without scoring and resets the streak', () => {
    const start: AnsweringState = { ...answering(3), selected: 1, score: 1, streak: 2 }
    const next = quizReducer(start, { type: 'skip' })
    expect(next.status === 'answering' && next.index).toBe(1)
    expect(next.status === 'answering' && next.score).toBe(1)
    expect(next.status === 'answering' && next.streak).toBe(0)
    expect(next.status === 'answering' && next.selected).toBeNull()
  })
})

describe('restart', () => {
  it('returns to the first question with a clean score', () => {
    const done: QuizState = { status: 'complete', score: 2, total: 3 }
    expect(quizReducer(done, { type: 'restart' })).toEqual(initQuiz(3))
  })
})

describe('quizAccuracy', () => {
  it('is the rounded percentage of correct answers', () => {
    expect(quizAccuracy(3, 4)).toBe(75)
    expect(quizAccuracy(0, 0)).toBe(0)
  })
})
