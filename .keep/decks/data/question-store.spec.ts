import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { InMemoryRepository } from '@app/shared/data'
import { QUESTION_REPOSITORY, QuestionStore } from './stores'
import { makeQuestion } from '../model/question'
import type { Question } from '../model/question'

const at = (ms: number) => new Date(ms).toISOString()
const question = (id: string, deckId: string, createdAt: string): Question =>
  makeQuestion({ id, createdAt, deckId, prompt: id, options: ['a', 'b'], correctAnswer: 0 })

function setup(seed: Question[] = []) {
  const repo = new InMemoryRepository<Question>(seed)
  TestBed.configureTestingModule({ providers: [{ provide: QUESTION_REPOSITORY, useValue: repo }] })
  return { repo, store: TestBed.inject(QuestionStore) }
}

describe('question store — reactive, Dependency Injection', () => {
  it('start() hydrates questions and becomes ready', () => {
    const { store } = setup([question('q1', 'r1', at(0))])
    expect(store.status()).toBe('idle')

    store.start()

    expect(store.status()).toBe('ready')
    expect(store.questions().map((q) => q.id)).toEqual(['q1'])
  })

  it('reflects saves and removes reactively, persisting through the port', async () => {
    const { repo, store } = setup()
    store.start()

    await store.save(question('q1', 'r1', at(0)))
    expect(store.questions()).toHaveLength(1)
    expect(await repo.getById('q1')).not.toBeNull()

    await store.remove('q1')
    expect(store.questions()).toHaveLength(0)
  })

  it('orders questions by their explicit order field', async () => {
    const { store } = setup()
    store.start()

    const second = { ...question('second', 'r1', at(0)), order: 2 }
    const first = { ...question('first', 'r1', at(1000)), order: 1 }
    await store.save(second)
    await store.save(first)

    expect(store.questions().map((q) => q.id)).toEqual(['first', 'second'])
  })
})
