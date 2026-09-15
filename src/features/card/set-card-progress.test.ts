import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { type Card, createCardStore, makeCard } from '@/entities/card'
import {
  createHistoryStore,
  type HistoryEntry,
  type HistoryStore,
} from '@/entities/learning-history'
import { started } from '@/shared/test/started'
import { markKnown, schedule } from '@/shared/lib'
import { setCardProgress } from './set-card-progress'

const NOW = Date.UTC(2026, 0, 10)

const newCard = (id: string): Card =>
  makeCard({ id, createdAt: new Date(0).toISOString(), deckId: 'd1', front: 'a', back: 'b' })

const cardStore = (cards: Card[]) => started(createCardStore(new InMemoryRepository<Card>(cards)))

const historyStore = (): HistoryStore =>
  started(createHistoryStore(new InMemoryRepository<HistoryEntry>()))

describe('setCardProgress', () => {
  it('stores the schedule the learner set', async () => {
    const cards = cardStore([newCard('c1')])
    const srs = markKnown(undefined, NOW)

    await setCardProgress(cards, historyStore(), 'c1', { srs }, NOW)

    expect(cards.getState().cards[0]?.srs).toEqual(srs)
  })

  it('records a hand-set schedule as an adjustment, not an answer', async () => {
    const history = historyStore()
    await setCardProgress(
      cardStore([newCard('c1')]),
      history,
      'c1',
      { srs: markKnown(undefined, NOW) },
      NOW,
    )

    expect(history.getState().history[0]).toMatchObject({
      cardId: 'c1',
      deckId: 'd1',
      kind: 'adjusted',
      intervalAfter: markKnown(undefined, NOW).interval,
    })
    expect(history.getState().history[0]?.grade).toBeUndefined()
  })

  it('records a graded adjustment as the answer it is', async () => {
    const history = historyStore()
    const srs = schedule(undefined, 'hard', NOW)

    await setCardProgress(cardStore([newCard('c1')]), history, 'c1', { srs, grade: 'hard' }, NOW)

    expect(history.getState().history[0]).toMatchObject({ kind: 'graded', grade: 'hard' })
  })

  it('puts a card back to new, keeping what it went through to get there', async () => {
    const cards = cardStore([{ ...newCard('c1'), srs: schedule(undefined, 'good', NOW) }])
    const history = historyStore()

    await setCardProgress(cards, history, 'c1', { srs: undefined }, NOW)

    expect(cards.getState().cards[0]?.srs).toBeUndefined()
    expect(history.getState().history).toHaveLength(1)
    expect(history.getState().history[0]?.intervalBefore).toBe(
      schedule(undefined, 'good', NOW).interval,
    )
  })
})
