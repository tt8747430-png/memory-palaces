import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { type Card, createCardStore, makeCard, priorAnswer } from '@/entities/card'
import {
  createHistoryStore,
  HISTORY_CAP,
  type HistoryEntry,
  type HistoryStore,
} from '@/entities/learning-history'
import { recordHistory } from '@/features/history'
import { started } from '@/shared/test/started'
import { isDue, schedule } from '@/shared/lib'
import { answerCard } from './answer-card'
import { gradeCard } from './grade-card'
import { restoreAnswer } from './restore-answer'
import { undoAnswer } from './undo-answer'

const NOW = Date.UTC(2026, 0, 10)

function newCard(id: string): Card {
  return makeCard({
    id,
    createdAt: new Date(0).toISOString(),
    deckId: 'd1',
    front: 'a',
    back: 'b',
  })
}

function storeWith(cards: Card[]) {
  return started(createCardStore(new InMemoryRepository<Card>(cards)))
}

function historyStore(seed: HistoryEntry[] = []): HistoryStore {
  return started(createHistoryStore(new InMemoryRepository<HistoryEntry>(seed)))
}

const entries = (history: HistoryStore) => history.getState().history
const fresh = { srs: undefined, fastReview: undefined }

describe('gradeCard', () => {
  it('schedules a brand-new card forward and persists it (good)', async () => {
    const store = storeWith([newCard('l1')])

    const { card } = await gradeCard(store, historyStore(), 'l1', 'good', NOW)

    expect(card.srs?.reps).toBe(1)
    expect(isDue(card.srs, NOW)).toBe(false)
    expect(store.getState().cards[0]?.srs).toEqual(card.srs)
  })

  it('matches the pure scheduler for the same input', async () => {
    const store = storeWith([newCard('l1')])
    const { card } = await gradeCard(store, historyStore(), 'l1', 'easy', NOW)
    expect(card.srs).toEqual(schedule(undefined, 'easy', NOW))
  })

  it("keeps a card due now when graded 'again'", async () => {
    const store = storeWith([newCard('l1')])
    const { card } = await gradeCard(store, historyStore(), 'l1', 'again', NOW)
    expect(isDue(card.srs, NOW)).toBe(true)
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = storeWith([newCard('l1')])
    const { card } = await gradeCard(store, historyStore(), 'l1', 'good', NOW)
    expect(card.updatedAt).toBe(new Date(NOW).toISOString())
  })

  it('throws when the card does not exist', async () => {
    const store = storeWith([])
    await expect(gradeCard(store, historyStore(), 'missing', 'good', NOW)).rejects.toThrow(
      /not found/i,
    )
  })

  it('writes the grade and the schedule it produced to the learning history', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()

    const { card, entry } = await gradeCard(store, history, 'l1', 'good', NOW)

    expect(entries(history)).toEqual([entry])
    expect(entry).toMatchObject({
      cardId: 'l1',
      deckId: 'd1',
      kind: 'graded',
      grade: 'good',
      intervalAfter: card.srs?.interval,
      dueAfter: card.srs?.due,
      createdAt: new Date(NOW).toISOString(),
    })
  })

  it('leaves intervalBefore absent on a first review, so a lapse cannot pass for one', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()

    const first = await gradeCard(store, history, 'l1', 'good', NOW)
    // 'again' zeroes the interval; the next answer must still report where it came from.
    await gradeCard(store, history, 'l1', 'again', NOW + 1000)
    const afterLapse = await gradeCard(store, history, 'l1', 'good', NOW + 2000)

    expect(first.entry.intervalBefore).toBeUndefined()
    expect(afterLapse.entry.intervalBefore).toBe(0)
  })

  it('records the interval the card came in on, not only the one it leaves with', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()

    await gradeCard(store, history, 'l1', 'good', NOW)
    const second = await gradeCard(store, history, 'l1', 'good', NOW + 1000)

    expect(entries(history)).toHaveLength(2)
    expect(second.entry).toMatchObject({
      intervalBefore: 1,
      intervalAfter: second.card.srs?.interval,
    })
  })
})

describe('answerCard', () => {
  it('records a Fast answer with no schedule attached to it', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()

    const { card, entry } = await answerCard(store, history, 'l1', 'gotIt', NOW)

    expect(card.fastReview).toBe('gotIt')
    expect(entry).toMatchObject({ cardId: 'l1', kind: 'answered', outcome: 'gotIt' })
    expect(entry.grade).toBeUndefined()
    expect(entry.intervalAfter).toBeUndefined()
  })
})

describe('recordHistory', () => {
  it('holds the history at its cap, dropping the oldest answers', async () => {
    const history = historyStore()
    for (let i = 0; i <= HISTORY_CAP; i++) {
      await recordHistory(
        history,
        { cardId: 'l1', deckId: 'd1', kind: 'answered', outcome: 'gotIt' },
        i,
      )
    }
    expect(entries(history)).toHaveLength(HISTORY_CAP)
    expect(entries(history)[0]?.createdAt).toBe(new Date(HISTORY_CAP).toISOString())
  })
})

describe('restoreAnswer', () => {
  it('reverses a grade by writing back the prior schedule', async () => {
    const store = storeWith([newCard('l1')])
    const before = priorAnswer(store.getState().cards[0]!)
    const { card } = await gradeCard(store, historyStore(), 'l1', 'good', NOW)
    expect(card.srs).not.toEqual(before.srs)

    const restored = await restoreAnswer(store, 'l1', before, NOW)

    expect(restored.srs).toBeUndefined()
    expect(store.getState().cards[0]?.srs).toBeUndefined()
  })

  it('puts back the Fast-review bucket too — an answer that never touched the schedule', async () => {
    const store = storeWith([newCard('l1')])
    const before = priorAnswer(store.getState().cards[0]!)
    await answerCard(store, historyStore(), 'l1', 'gotIt', NOW)
    expect(store.getState().cards[0]?.fastReview).toBe('gotIt')

    await restoreAnswer(store, 'l1', before, NOW)

    expect(store.getState().cards[0]?.fastReview).toBeUndefined()
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = storeWith([newCard('l1')])
    const restored = await restoreAnswer(store, 'l1', fresh, NOW)
    expect(restored.updatedAt).toBe(new Date(NOW).toISOString())
  })

  it('throws when the card does not exist', async () => {
    const store = storeWith([])
    await expect(restoreAnswer(store, 'missing', fresh, NOW)).rejects.toThrow(/not found/i)
  })
})

describe('undoAnswer', () => {
  it('takes the answer off the history along with the schedule', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()
    const { entry } = await gradeCard(store, history, 'l1', 'good', NOW)

    await undoAnswer(store, history, 'l1', fresh, entry.id, NOW)

    expect(store.getState().cards[0]?.srs).toBeUndefined()
    expect(entries(history)).toHaveLength(0)
  })

  it('removes the entry it was handed, never whichever looks newest', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()
    const first = await gradeCard(store, history, 'l1', 'good', NOW)
    const second = await gradeCard(store, history, 'l1', 'hard', NOW + 1000)

    await undoAnswer(store, history, 'l1', priorAnswer(first.card), second.entry.id, NOW + 2000)

    expect(entries(history).map((entry) => entry.id)).toEqual([first.entry.id])
  })

  it('still restores the card when the action being undone wrote no entry', async () => {
    const store = storeWith([newCard('l1')])
    const history = historyStore()
    await gradeCard(store, history, 'l1', 'good', NOW)

    await undoAnswer(store, history, 'l1', fresh, undefined, NOW)

    expect(store.getState().cards[0]?.srs).toBeUndefined()
    expect(entries(history)).toHaveLength(1)
  })
})
