import { describe, expect, it } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { createCardStore, type Card, makeCard } from '@/entities/card'
import { isDue, schedule } from '@/shared/lib'
import { gradeCard } from './grade-card'
import { restoreSchedule } from './restore-schedule'

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
  const store = createCardStore(new InMemoryRepository<Card>(cards))
  store.getState().start()
  return store
}

describe('gradeCard', () => {
  it('schedules a brand-new card forward and persists it (good)', async () => {
    const store = storeWith([newCard('l1')])

    const graded = await gradeCard(store, 'l1', 'good', NOW)

    expect(graded.srs?.reps).toBe(1)
    expect(isDue(graded.srs, NOW)).toBe(false)
    expect(store.getState().cards[0]?.srs).toEqual(graded.srs)
  })

  it('matches the pure scheduler for the same input', async () => {
    const store = storeWith([newCard('l1')])
    const graded = await gradeCard(store, 'l1', 'easy', NOW)
    expect(graded.srs).toEqual(schedule(undefined, 'easy', NOW))
  })

  it("keeps a card due now when graded 'again'", async () => {
    const store = storeWith([newCard('l1')])
    const graded = await gradeCard(store, 'l1', 'again', NOW)
    expect(isDue(graded.srs, NOW)).toBe(true)
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = storeWith([newCard('l1')])
    const graded = await gradeCard(store, 'l1', 'good', NOW)
    expect(graded.updatedAt).toBe(new Date(NOW).toISOString())
  })

  it('throws when the card does not exist', async () => {
    const store = storeWith([])
    await expect(gradeCard(store, 'missing', 'good', NOW)).rejects.toThrow(/not found/i)
  })
})

describe('restoreSchedule', () => {
  it('reverses a grade by writing back the prior schedule', async () => {
    const store = storeWith([newCard('l1')])
    const before = store.getState().cards[0]?.srs
    const graded = await gradeCard(store, 'l1', 'good', NOW)
    expect(graded.srs).not.toEqual(before)

    const restored = await restoreSchedule(store, 'l1', before, NOW)

    expect(restored.srs).toEqual(before)
    expect(store.getState().cards[0]?.srs).toEqual(before)
  })

  it('returns a first-ever graded card to brand-new (undefined schedule)', async () => {
    const store = storeWith([newCard('l1')])
    await gradeCard(store, 'l1', 'good', NOW)
    expect(store.getState().cards[0]?.srs).toBeDefined()

    await restoreSchedule(store, 'l1', undefined, NOW)

    expect(store.getState().cards[0]?.srs).toBeUndefined()
  })

  it('bumps updatedAt to the injected clock', async () => {
    const store = storeWith([newCard('l1')])
    const restored = await restoreSchedule(store, 'l1', undefined, NOW)
    expect(restored.updatedAt).toBe(new Date(NOW).toISOString())
  })

  it('throws when the card does not exist', async () => {
    const store = storeWith([])
    await expect(restoreSchedule(store, 'missing', undefined, NOW)).rejects.toThrow(/not found/i)
  })
})
