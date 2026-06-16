import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { EventBus, EventBusContext, type AppEvents } from '@/shared/lib'
import { InMemoryRepository } from '@/shared/api'
import {
  createNotificationStore,
  NotificationStoreContext,
  selectNotifications,
  type AppNotification,
} from '@/entities/notification'
import { NotificationBridge } from './NotificationBridge'

afterEach(cleanup)

function setup() {
  const bus = new EventBus<AppEvents>()
  const store = createNotificationStore(new InMemoryRepository<AppNotification>())
  render(
    <NotificationStoreContext value={store}>
      <EventBusContext value={bus}>
        <NotificationBridge />
      </EventBusContext>
    </NotificationStoreContext>,
  )
  return { bus, store }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('NotificationBridge', () => {
  it('persists a level-up event as an unread notification', async () => {
    const { bus, store } = setup()

    await act(async () => {
      bus.emit('level-up', { level: 4 })
      await flush()
    })

    const list = selectNotifications(store.getState())
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ type: 'level-up', level: 4, read: false })
  })

  it('persists streak and quiz events', async () => {
    const { bus, store } = setup()

    await act(async () => {
      bus.emit('streak', { count: 7 })
      bus.emit('quiz', { accuracy: 90, xp: 60 })
      await flush()
    })

    const types = selectNotifications(store.getState()).map((n) => n.type)
    expect(types).toContain('streak')
    expect(types).toContain('quiz')
  })

  it('ignores xp-gain events — they are not part of the history', async () => {
    const { bus, store } = setup()

    await act(async () => {
      bus.emit('xp-gain', { amount: 50 })
      await flush()
    })

    expect(selectNotifications(store.getState())).toHaveLength(0)
  })
})
