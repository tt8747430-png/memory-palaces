import { describe, expect, it, vi } from 'vitest'
import { InMemoryRepository, type StoragePort } from '@/shared/api'
import { started } from '@/shared/test/started'
import { createDeckStore, type Deck, makeDeck } from '@/entities/deck'
import { type Card, createCardStore, makeCard } from '@/entities/card'
import { createQuestionStore, makeQuestion, type Question } from '@/entities/question'
import { deleteDeck } from './delete-deck'

const NOW = new Date(0).toISOString()

const deck = (id: string, parentId: string | null = null): Deck => ({
  ...makeDeck({ id, createdAt: NOW, name: id }),
  parentId,
})
const card = (id: string, deckId: string): Card =>
  makeCard({ id, createdAt: NOW, deckId, front: id, back: id })

const question = (id: string, deckId: string): Question =>
  makeQuestion({ id, createdAt: NOW, deckId, prompt: id, options: ['a', 'b'], correctAnswer: 0 })

function setup(
  decks: Deck[],
  cards: Card[] = [],
  remove = vi.fn().mockResolvedValue(undefined),
  questions: Question[] = [],
) {
  const storage = { upload: vi.fn(), remove, signedUrl: vi.fn() } as unknown as StoragePort
  return {
    storage,
    remove,
    deckStore: started(createDeckStore(new InMemoryRepository<Deck>(decks))),
    cardStore: started(createCardStore(new InMemoryRepository<Card>(cards))),
    questionStore: started(createQuestionStore(new InMemoryRepository<Question>(questions))),
  }
}

describe('deleteDeck', () => {
  it('deletes the deck, its subdecks and their cards', async () => {
    const { deckStore, cardStore, questionStore, storage } = setup(
      [deck('d1'), deck('d1-sub', 'd1'), deck('d2')],
      [card('c1', 'd1'), card('c2', 'd1-sub'), card('c3', 'd2')],
    )

    await deleteDeck({ deckStore, cardStore, questionStore, storage, userId: 'u1' }, 'd1')

    expect(deckStore.getState().decks.map((d) => d.id)).toEqual(['d2'])
    expect(cardStore.getState().cards.map((c) => c.id)).toEqual(['c3'])
  })

  it('deletes the questions inside it too — a question never outlives its deck', async () => {
    const { deckStore, cardStore, questionStore, storage } = setup(
      [deck('d1'), deck('d1-sub', 'd1'), deck('d2')],
      [],
      undefined,
      [question('q1', 'd1'), question('q2', 'd1-sub'), question('q3', 'd2')],
    )

    await deleteDeck({ deckStore, cardStore, questionStore, storage, userId: 'u1' }, 'd1')

    expect(questionStore.getState().questions.map((q) => q.id)).toEqual(['q3'])
  })

  it('removes the cover object of every deck it deleted', async () => {
    const { deckStore, cardStore, questionStore, storage, remove } = setup([
      deck('d1'),
      deck('d1-sub', 'd1'),
    ])

    await deleteDeck({ deckStore, cardStore, questionStore, storage, userId: 'u1' }, 'd1')

    expect(remove.mock.calls.map(([ref]) => ref)).toEqual(
      expect.arrayContaining([
        { bucket: 'deck-images', userId: 'u1', entityId: 'd1' },
        { bucket: 'deck-images', userId: 'u1', entityId: 'd1-sub' },
      ]),
    )
  })

  it('tolerates a failed cleanup — the account purge is the backstop', async () => {
    const remove = vi.fn().mockRejectedValue(new Error('offline'))
    const { deckStore, cardStore, questionStore, storage } = setup([deck('d1')], [], remove)

    await expect(
      deleteDeck({ deckStore, cardStore, questionStore, storage, userId: 'u1' }, 'd1'),
    ).resolves.toBeUndefined()
    expect(deckStore.getState().decks).toEqual([])
  })

  it('touches storage for nobody — a guest has no stored object to orphan', async () => {
    const { deckStore, cardStore, questionStore, storage, remove } = setup([deck('d1')])

    await deleteDeck({ deckStore, cardStore, questionStore, storage, userId: null }, 'd1')

    expect(remove).not.toHaveBeenCalled()
  })
})
