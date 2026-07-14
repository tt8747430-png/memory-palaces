import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createCardStore, cardsForDeck, type Card, selectCards } from '@/entities/card'
import {
  createQuestionStore,
  type Question,
  questionsForDeck,
  selectQuestions,
} from '@/entities/question'
import { applyDeckContent } from './apply-content'

describe('applyDeckContent', () => {
  it('writes parsed cards and questions into a deck in order', async () => {
    const cardStore = createCardStore(new InMemoryRepository<Card>())
    const questionStore = createQuestionStore(new InMemoryRepository<Question>())
    cardStore.getState().start()
    questionStore.getState().start()

    const result = await applyDeckContent(cardStore, questionStore, 'd1', {
      cards: [
        { front: 'a', back: 'A' },
        { front: 'b', back: 'B', hint: 'picture' },
      ],
      questions: [{ prompt: 'p?', options: ['x', 'y'], correctAnswer: 1 }],
    })

    expect(result).toEqual({ cards: 2, questions: 1 })

    const cards = cardsForDeck(selectCards(cardStore.getState()), 'd1')
    expect(cards.map((c) => c.front)).toEqual(['a', 'b'])
    expect(cards[1]?.hint).toBe('picture')

    const questions = questionsForDeck(selectQuestions(questionStore.getState()), 'd1')
    expect(questions).toHaveLength(1)
    expect(questions[0]?.correctAnswer).toBe(1)
  })

  it('restores the full card fidelity (tip, flag, known status, schedule) on import', async () => {
    const cardStore = createCardStore(new InMemoryRepository<Card>())
    const questionStore = createQuestionStore(new InMemoryRepository<Question>())
    cardStore.getState().start()
    questionStore.getState().start()

    const srs = {
      due: '2026-01-01T00:00:00.000Z',
      interval: 4,
      ease: 2.5,
      reps: 3,
      lapses: 1,
      lastReviewed: '2025-12-28T00:00:00.000Z',
    }
    await applyDeckContent(cardStore, questionStore, 'd1', {
      cards: [{ front: 'a', back: 'A', tip: 'peek', flagged: true, memorized: true, srs }],
      questions: [],
    })

    const [card] = cardsForDeck(selectCards(cardStore.getState()), 'd1')
    expect(card?.tip).toBe('peek')
    expect(card?.flagged).toBe(true)
    expect(card?.memorized).toBe(true)
    expect(card?.srs).toEqual(srs)
  })
})
