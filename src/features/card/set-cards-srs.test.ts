import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { type Card, createCardStore, makeCard } from '@/entities/card'
import {
  createHistoryStore,
  type HistoryEntry,
  type HistoryStore,
} from '@/entities/learning-history'
import { recordHistory } from '@/features/history'
import { started } from '@/shared/test/started'
import { markKnown } from '@/shared/lib'
import { markCardsKnown, resetCardsSrs } from './set-cards-srs'

const NOW = Date.UTC(2026, 0, 10)

const newCard = (id: string): Card =>
  makeCard({ id, createdAt: new Date(0).toISOString(), deckId: 'd1', front: 'a', back: 'b' })

const cardStore = (cards: Card[]) => started(createCardStore(new InMemoryRepository<Card>(cards)))

const historyStore = (): HistoryStore =>
  started(createHistoryStore(new InMemoryRepository<HistoryEntry>()))

describe('markCardsKnown', () => {
  it('puts the Mastered mark on the learning history, schedule and all', async () => {
    const cards = cardStore([newCard('c1')])
    const history = historyStore()

    await markCardsKnown(cards, history, ['c1'], NOW)

    const expected = markKnown(undefined, NOW)
    expect(history.getState().history).toHaveLength(1)
    expect(history.getState().history[0]).toMatchObject({
      cardId: 'c1',
      deckId: 'd1',
      kind: 'mastered',
      intervalAfter: expected.interval,
      dueAfter: expected.due,
    })
    expect(history.getState().history[0]?.grade).toBeUndefined()
  })

  it('records the interval the card came in on', async () => {
    const cards = cardStore([newCard('c1')])
    const history = historyStore()
    await markCardsKnown(cards, history, ['c1'], NOW)
    await markCardsKnown(cards, history, ['c1'], NOW + 1000)

    expect(history.getState().history[0]?.intervalBefore).toBe(markKnown(undefined, NOW).interval)
  })

  it('writes one entry per card in a batch', async () => {
    const cards = cardStore([newCard('c1'), newCard('c2')])
    const history = historyStore()

    await markCardsKnown(cards, history, ['c1', 'c2'], NOW)

    expect(
      history
        .getState()
        .history.map((entry) => entry.cardId)
        .sort(),
    ).toEqual(['c1', 'c2'])
  })
})

describe('resetCardsSrs', () => {
  it('clears the history it would otherwise leave describing a schedule the card lost', async () => {
    const cards = cardStore([newCard('c1'), newCard('c2')])
    const history = historyStore()
    await recordHistory(history, { cardId: 'c1', deckId: 'd1', kind: 'graded', grade: 'good' }, NOW)
    await recordHistory(history, { cardId: 'c2', deckId: 'd1', kind: 'graded', grade: 'good' }, NOW)

    await resetCardsSrs(cards, history, ['c1'], NOW)

    expect(history.getState().history.map((entry) => entry.cardId)).toEqual(['c2'])
  })

  it('still drops the schedule and the fast-review bucket', async () => {
    const cards = cardStore([newCard('c1')])
    const history = historyStore()
    await markCardsKnown(cards, history, ['c1'], NOW)

    await resetCardsSrs(cards, history, ['c1'], NOW)

    expect(cards.getState().cards[0]?.srs).toBeUndefined()
    expect(cards.getState().cards[0]?.fastReview).toBeUndefined()
  })
})
