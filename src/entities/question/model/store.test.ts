import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createQuestionStore } from './store'
import { makeQuestion, type Question } from './types'

const at = (ms: number) => new Date(ms).toISOString()
const question = (id: string, roomId: string, createdAt: string): Question =>
  makeQuestion({ id, createdAt, roomId, prompt: id, options: ['a', 'b'], correctAnswer: 0 })

describe('question store — reactive, Dependency Injection', () => {
  it('start() hydrates questions and becomes ready', () => {
    const repo = new InMemoryRepository<Question>([question('q1', 'r1', at(0))])
    const store = createQuestionStore(repo)
    expect(store.getState().status).toBe('idle')

    store.getState().start()

    expect(store.getState().status).toBe('ready')
    expect(store.getState().questions.map((q) => q.id)).toEqual(['q1'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const repo = new InMemoryRepository<Question>()
    const store = createQuestionStore(repo)
    store.getState().start()

    await store.getState().save(question('q1', 'r1', at(0)))
    expect(store.getState().questions).toHaveLength(1)
    expect(await repo.getById('q1')).not.toBeNull()

    await store.getState().remove('q1')
    expect(store.getState().questions).toHaveLength(0)
  })

  it('orders questions oldest-first by createdAt', async () => {
    const repo = new InMemoryRepository<Question>()
    const store = createQuestionStore(repo)
    store.getState().start()

    await store.getState().save(question('new', 'r1', at(1000)))
    await store.getState().save(question('old', 'r1', at(0)))

    expect(store.getState().questions.map((q) => q.id)).toEqual(['old', 'new'])
  })
})
