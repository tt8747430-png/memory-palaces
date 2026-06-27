import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createLocusStore, lociForRoom, type Locus, selectLoci } from '@/entities/locus'
import {
  createQuestionStore,
  type Question,
  questionsForRoom,
  selectQuestions,
} from '@/entities/question'
import { applyRoomContent } from './apply-content'

describe('applyRoomContent', () => {
  it('writes parsed cards and questions into a room in order', async () => {
    const locusStore = createLocusStore(new InMemoryRepository<Locus>())
    const questionStore = createQuestionStore(new InMemoryRepository<Question>())
    locusStore.getState().start()
    questionStore.getState().start()

    const result = await applyRoomContent(locusStore, questionStore, 'r1', {
      loci: [
        { front: 'a', back: 'A' },
        { front: 'b', back: 'B', hint: 'picture' },
      ],
      questions: [{ prompt: 'p?', options: ['x', 'y'], correctAnswer: 1 }],
    })

    expect(result).toEqual({ loci: 2, questions: 1 })

    const loci = lociForRoom(selectLoci(locusStore.getState()), 'r1')
    expect(loci.map((l) => l.front)).toEqual(['a', 'b'])
    expect(loci[1]?.hint).toBe('picture')

    const questions = questionsForRoom(selectQuestions(questionStore.getState()), 'r1')
    expect(questions).toHaveLength(1)
    expect(questions[0]?.correctAnswer).toBe(1)
  })
})
