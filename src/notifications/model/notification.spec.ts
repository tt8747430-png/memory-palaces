import { describe, expect, it } from 'vitest'
import { makeNotification, NOTIFICATION_CAP } from './notification'

const at = (ms: number) => new Date(ms).toISOString()

describe('makeNotification', () => {
  it('builds a level-up notification, unread, with timestamps mirroring createdAt', () => {
    const n = makeNotification({
      id: 'n1',
      createdAt: at(0),
      type: 'level-up',
      level: 3,
      xpGain: 50,
    })
    expect(n).toMatchObject({
      id: 'n1',
      createdAt: at(0),
      updatedAt: at(0),
      type: 'level-up',
      read: false,
      level: 3,
      xpGain: 50,
    })
  })

  it('omits optional milestone params that were not provided', () => {
    const n = makeNotification({ id: 'n2', createdAt: at(0), type: 'streak', count: 7 })
    expect(n.count).toBe(7)
    expect(n.level).toBeUndefined()
    expect(n.accuracy).toBeUndefined()
    expect(n.xpGain).toBeUndefined()
  })

  it('respects an explicit read flag', () => {
    const n = makeNotification({
      id: 'n3',
      createdAt: at(0),
      type: 'quiz',
      accuracy: 90,
      read: true,
    })
    expect(n.read).toBe(true)
  })

  it('caps the persisted history at 40', () => {
    expect(NOTIFICATION_CAP).toBe(40)
  })
})
