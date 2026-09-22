import { describe, expect, it } from 'vitest'
import { makeNotification, milestoneXp, NOTIFICATION_CAP } from './types'

const at = (ms: number) => new Date(ms).toISOString()

describe('makeNotification', () => {
  it('builds a level-up notification, unread, with timestamps mirroring createdAt', () => {
    const n = makeNotification({
      id: 'n1',
      createdAt: at(0),
      milestone: { type: 'level-up', level: 3 },
    })
    expect(n).toEqual({
      id: 'n1',
      createdAt: at(0),
      updatedAt: at(0),
      read: false,
      milestone: { type: 'level-up', level: 3 },
    })
  })

  it('carries only the numbers its kind of milestone has', () => {
    const n = makeNotification({
      id: 'n2',
      createdAt: at(0),
      milestone: { type: 'streak', count: 7 },
    })
    expect(n.milestone).toEqual({ type: 'streak', count: 7 })
  })

  it('respects an explicit read flag', () => {
    const n = makeNotification({
      id: 'n3',
      createdAt: at(0),
      milestone: { type: 'quiz', accuracy: 90, xpGain: 40 },
      read: true,
    })
    expect(n.read).toBe(true)
  })

  it('refuses a level nobody could have reached', () => {
    expect(() =>
      makeNotification({ id: 'n4', createdAt: at(0), milestone: { type: 'level-up', level: 0 } }),
    ).toThrow(/level/i)
    expect(() =>
      makeNotification({ id: 'n5', createdAt: at(0), milestone: { type: 'level-up', level: 2.5 } }),
    ).toThrow(/level/i)
  })

  it('refuses a streak of no days', () => {
    expect(() =>
      makeNotification({ id: 'n6', createdAt: at(0), milestone: { type: 'streak', count: 0 } }),
    ).toThrow(/streak/i)
  })

  it('refuses an accuracy that is not a percentage', () => {
    expect(() =>
      makeNotification({
        id: 'n7',
        createdAt: at(0),
        milestone: { type: 'quiz', accuracy: 900, xpGain: 0 },
      }),
    ).toThrow(/accuracy/i)
  })

  it('refuses XP that was lost rather than gained', () => {
    expect(() =>
      makeNotification({
        id: 'n8',
        createdAt: at(0),
        milestone: { type: 'quiz', accuracy: 50, xpGain: -1 },
      }),
    ).toThrow(/XP/i)
  })
})

describe('milestoneXp', () => {
  it('names the XP a quiz earned', () => {
    expect(milestoneXp({ type: 'quiz', accuracy: 90, xpGain: 60 })).toBe(60)
  })

  it('names nothing when a quiz earned none, so no chip is drawn', () => {
    expect(milestoneXp({ type: 'quiz', accuracy: 90, xpGain: 0 })).toBeUndefined()
  })

  it('names nothing for the kinds that carry no XP', () => {
    expect(milestoneXp({ type: 'level-up', level: 3 })).toBeUndefined()
    expect(milestoneXp({ type: 'streak', count: 7 })).toBeUndefined()
  })
})

describe('the notification list', () => {
  it('is capped at 40 — the keeper trims past it', () => {
    expect(NOTIFICATION_CAP).toBe(40)
  })
})
