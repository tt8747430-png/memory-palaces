import { describe, expect, it } from 'vitest'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { storedPreferences } from '@/entities/preferences/testing/stored-preferences'
import {
  mergeCardConflict,
  mergePreferencesConflict,
  mergeProgressConflict,
} from './conflict-handlers'

const CTX = 'test'

const doc = <T>(value: T) => value as T & { _deleted: boolean }

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

  it('adds up what each device earned when it knows what both had seen', async () => {
    const resolved = await mergeProgressConflict.resolve(
      {
        assumedMasterState: progress({ updatedAt: 't1', xp: 100 }),
        realMasterState: progress({ updatedAt: 't2', xp: 120 }),
        newDocumentState: progress({ updatedAt: 't3', xp: 110 }),
      },
      CTX,
    )
    expect(resolved.xp).toBe(130)
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
      frozen: false,
      reversed: false,
      order: 0,
      _deleted: false,
      ...over,
    })

  it('keeps the edit made elsewhere and the study made here — the lost update', async () => {
    const seen = card({ updatedAt: 't1', back: 'old text' })
    const resolved = await mergeCardConflict.resolve(
      {
        assumedMasterState: seen,
        realMasterState: card({ updatedAt: 't2', back: 'fixed elsewhere' }),
        newDocumentState: card({
          updatedAt: 't3',
          back: 'old text',
          srs: { due: 'd', interval: 1, ease: 2.5, reps: 1, lapses: 0, lastReviewed: 'r' },
        }),
      },
      CTX,
    )
    expect(resolved).toMatchObject({ back: 'fixed elsewhere', srs: { reps: 1 }, updatedAt: 't3' })
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

describe('mergePreferencesConflict', () => {
  const prefs = (updatedAt: string, over: Parameters<typeof storedPreferences>[0] = {}) =>
    doc({ ...storedPreferences({ updatedAt, ...over }), _deleted: false })

  it('keeps the setting another device changed while this one changed a different one', async () => {
    const resolved = await mergePreferencesConflict.resolve(
      {
        assumedMasterState: prefs('t7'),
        realMasterState: prefs('t8', { theme: 'dark' }),
        newDocumentState: prefs('t9', { devMode: true }),
      },
      CTX,
    )
    expect(resolved).toMatchObject({
      theme: 'dark',
      devMode: true,
      updatedAt: 't9',
      _deleted: false,
    })
  })
})
