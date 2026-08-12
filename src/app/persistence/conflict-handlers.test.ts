import { describe, expect, it } from 'vitest'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { lastWriteWins, mergeCardConflict, mergeProgressConflict } from './conflict-handlers'

const CTX = 'test'

const doc = <T,>(value: T) => value as T & { _deleted: boolean }

describe('lastWriteWins', () => {
  it('keeps the document with the newer updatedAt', async () => {
    const resolved = await lastWriteWins<{ id: string; updatedAt: string; name: string }>().resolve(
      {
        realMasterState: doc({ id: 'd1', updatedAt: 't2', name: 'server', _deleted: false }),
        newDocumentState: doc({ id: 'd1', updatedAt: 't1', name: 'local', _deleted: false }),
      },
      CTX,
    )

    expect(resolved).toMatchObject({ name: 'server' })
  })

  it('prefers the local write when it is newer', async () => {
    const resolved = await lastWriteWins<{ id: string; updatedAt: string; name: string }>().resolve(
      {
        realMasterState: doc({ id: 'd1', updatedAt: 't1', name: 'server', _deleted: false }),
        newDocumentState: doc({ id: 'd1', updatedAt: 't3', name: 'local', _deleted: false }),
      },
      CTX,
    )

    expect(resolved).toMatchObject({ name: 'local' })
  })

  it('sees no conflict when both sides carry the same clock and tombstone', () => {
    const a = doc({ id: 'd1', updatedAt: 't1', name: 'x', _deleted: false })
    const b = doc({ id: 'd1', updatedAt: 't1', name: 'x', _deleted: false })

    const handler = lastWriteWins<{ id: string; updatedAt: string; name: string }>()
    expect(handler.isEqual(a, b, CTX)).toBe(true)
    expect(handler.isEqual(a, { ...b, updatedAt: 't2' }, CTX)).toBe(false)
    expect(handler.isEqual(a, { ...b, _deleted: true }, CTX)).toBe(false)
  })
})

describe('mergeProgressConflict', () => {
  const progress = (over: Partial<Progress>): Progress & { _deleted: boolean } =>
    doc({
      id: 'p1',
      createdAt: 't0',
      updatedAt: 't1',
      xp: 0,
      streakCount: 0,
      longestStreak: 0,
      lastTrainingDate: null,
      streakFreezes: 0,
      bestQuizAccuracy: 0,
      trainingDays: [],
      activeDayKey: null,
      activeDayCount: 0,
      _deleted: false,
      ...over,
    })

  it('counter-merges instead of dropping a device worth of study', async () => {
    const resolved = await mergeProgressConflict.resolve(
      {
        realMasterState: progress({ updatedAt: 't1', xp: 200, longestStreak: 9 }),
        newDocumentState: progress({ updatedAt: 't2', xp: 150, streakCount: 4 }),
      },
      CTX,
    )

    expect(resolved).toMatchObject({ xp: 200, longestStreak: 9, streakCount: 4 })
  })
})

describe('mergeCardConflict', () => {
  const card = (over: Partial<Card> & { _deleted?: boolean }): Card & { _deleted: boolean } =>
    doc({
      id: 'c1',
      createdAt: 't0',
      updatedAt: 't1',
      deckId: 'd1',
      front: 'F',
      back: 'B',
      flagged: false,
      memorized: false,
      order: 0,
      _deleted: false,
      ...over,
    })

  it('keeps the newest content and the merged review counters', async () => {
    const resolved = await mergeCardConflict.resolve(
      {
        realMasterState: card({
          updatedAt: 't1',
          front: 'server',
          srs: { due: 'd', interval: 2, ease: 2.5, reps: 9, lapses: 0, lastReviewed: 'r1' },
        }),
        newDocumentState: card({
          updatedAt: 't2',
          front: 'local',
          srs: { due: 'd2', interval: 3, ease: 2.4, reps: 3, lapses: 1, lastReviewed: 'r2' },
        }),
      },
      CTX,
    )

    expect(resolved).toMatchObject({ front: 'local' })
    expect(resolved.srs).toMatchObject({ reps: 9, lapses: 1, due: 'd2' })
  })

  it('carries the tombstone of the newest write', async () => {
    const resolved = await mergeCardConflict.resolve(
      {
        realMasterState: card({ updatedAt: 't1' }),
        newDocumentState: card({ updatedAt: 't2', _deleted: true }),
      },
      CTX,
    )

    expect(resolved._deleted).toBe(true)
  })
})
