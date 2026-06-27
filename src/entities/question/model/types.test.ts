import { describe, expect, it } from 'vitest'
import { makeQuestion } from './types'

const T0 = '2026-01-01T00:00:00.000Z'

describe('makeQuestion', () => {
  it('creates a question and copies its options array', () => {
    const options = ['a', 'b', 'c']
    const question = makeQuestion({ id: 'q1', createdAt: T0, roomId: 'r1', prompt: 'P?', options, correctAnswer: 1 })
    expect(question).toMatchObject({ id: 'q1', updatedAt: T0, roomId: 'r1', prompt: 'P?', correctAnswer: 1 })
    expect(question.options).toEqual(options)
    expect(question.options).not.toBe(options)
  })

  it('rejects fewer than two options or an out-of-range answer', () => {
    expect(() => makeQuestion({ id: 'q1', createdAt: T0, roomId: 'r1', prompt: 'P', options: ['a'], correctAnswer: 0 })).toThrow()
    expect(() => makeQuestion({ id: 'q1', createdAt: T0, roomId: 'r1', prompt: 'P', options: ['a', 'b'], correctAnswer: 2 })).toThrow()
    expect(() => makeQuestion({ id: 'q1', createdAt: T0, roomId: 'r1', prompt: 'P', options: ['a', 'b'], correctAnswer: -1 })).toThrow()
  })
})
