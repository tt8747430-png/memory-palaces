import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { InMemoryRepository } from '@app/shared/data'
import { EVENT_BUS } from '@app/shared/data/event-bus.token'
import { NOTIFICATION_REPOSITORY, NotificationStore } from '@app/notifications/data/notification-store'
import type { AppNotification } from '@app/notifications/model/notification'
import { NotificationBridge } from './notification-bridge'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function setup() {
  TestBed.configureTestingModule({
    providers: [
      { provide: NOTIFICATION_REPOSITORY, useValue: new InMemoryRepository<AppNotification>() },
    ],
  })
  TestBed.inject(NotificationBridge).init()
  return { bus: TestBed.inject(EVENT_BUS), store: TestBed.inject(NotificationStore) }
}

describe('NotificationBridge', () => {
  it('persists a level-up event as an unread notification', async () => {
    const { bus, store } = setup()

    bus.emit('level-up', { level: 4 })
    await flush()

    const list = store.notifications()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ type: 'level-up', level: 4, read: false })
  })

  it('persists streak and quiz events', async () => {
    const { bus, store } = setup()

    bus.emit('streak', { count: 7 })
    bus.emit('quiz', { accuracy: 90, xp: 60 })
    await flush()

    const types = store.notifications().map((n) => n.type)
    expect(types).toContain('streak')
    expect(types).toContain('quiz')
  })

  it('ignores xp-gain events — they are not part of the history', async () => {
    const { bus, store } = setup()

    bus.emit('xp-gain', { amount: 50 })
    await flush()

    expect(store.notifications()).toHaveLength(0)
  })
})
