import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createDeckStore, type Deck, selectDecks } from '@/entities/deck'
import { createCardStore, cardsForDeck, type Card, selectCards } from '@/entities/card'
import {
  createQuestionStore,
  type Question,
  questionsForDeck,
  selectQuestions,
} from '@/entities/question'
import { childDecks } from '@/shared/lib'
import { importDecks } from './import-decks'

function stores() {
  const deckStore = createDeckStore(new InMemoryRepository<Deck>())
  const cardStore = createCardStore(new InMemoryRepository<Card>())
  const questionStore = createQuestionStore(new InMemoryRepository<Question>())
  deckStore.getState().start()
  cardStore.getState().start()
  questionStore.getState().start()
  return { deckStore, cardStore, questionStore }
}

describe('importDecks', () => {
  it('creates each deck as a subdeck in order and fills it with its cards and questions', async () => {
    const { deckStore, cardStore, questionStore } = stores()
    await deckStore.getState().save({
      id: 'parent',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Bible',
      description: '',
      icon: '',
      color: '',
      folderId: null,
      parentId: null,
      order: 0,
      favorite: false,
      archived: false,
      settings: {},
    })

    const result = await importDecks(deckStore, cardStore, questionStore, 'parent', [
      {
        title: 'Genesis 1',
        loci: [
          { front: '1:1', back: 'In the beginning…' },
          { front: '1:2', back: 'And the earth…' },
        ],
        questions: [{ prompt: 'Day one?', options: ['Light', 'Sea'], correctAnswer: 0 }],
      },
      { title: 'Genesis 2', loci: [{ front: '2:1', back: 'Thus the heavens…' }], questions: [] },
    ])

    expect(result).toEqual({ decks: 2, cards: 3, questions: 1 })
    const subdecks = childDecks(selectDecks(deckStore.getState()), 'parent')
    expect(subdecks.map((d) => d.name)).toEqual(['Genesis 1', 'Genesis 2'])

    const [first, second] = subdecks
    expect(cardsForDeck(selectCards(cardStore.getState()), first!.id)).toHaveLength(2)
    expect(questionsForDeck(selectQuestions(questionStore.getState()), first!.id)).toHaveLength(1)
    expect(cardsForDeck(selectCards(cardStore.getState()), second!.id)).toHaveLength(1)
  })

  it('reports zero for an empty import', async () => {
    const { deckStore, cardStore, questionStore } = stores()
    const result = await importDecks(deckStore, cardStore, questionStore, null, [])
    expect(result).toEqual({ decks: 0, cards: 0, questions: 0 })
    expect(selectDecks(deckStore.getState())).toEqual([])
  })
})
