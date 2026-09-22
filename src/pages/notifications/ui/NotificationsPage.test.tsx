import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { InMemoryRepository } from '@/shared/api'
import {
  type AppNotification,
  createNotificationStore,
  makeNotification,
  type NotificationStore,
  NotificationStoreContext,
  selectUnreadCount,
} from '@/entities/notification'
import { NotificationsPage } from './NotificationsPage'

afterEach(cleanup)

const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 0))))

function startedStore(seed: AppNotification[] = []): NotificationStore {
  const store = createNotificationStore(new InMemoryRepository<AppNotification>(seed))
  store.getState().start()
  return store
}

function renderPage(store: NotificationStore) {
  render(
    <I18nextProvider i18n={i18n}>
      <NotificationStoreContext value={store}>
        <NotificationsPage />
      </NotificationStoreContext>
    </I18nextProvider>,
  )
}

const seeded = (id = 'a') =>
  makeNotification({
    id,
    createdAt: new Date(0).toISOString(),
    milestone: { type: 'streak', count: 7 },
  })

describe('NotificationsPage', () => {
  it('marks all notifications read on open', async () => {
    const store = startedStore([seeded()])
    expect(selectUnreadCount(store.getState())).toBe(1)

    renderPage(store)
    await flush()

    expect(selectUnreadCount(store.getState())).toBe(0)
  })

  it('marks them read once, not once per notification still unread', async () => {
    const repo = new InMemoryRepository<AppNotification>([seeded('a'), seeded('b'), seeded('c')])
    const saves = vi.spyOn(repo, 'save')
    const store = createNotificationStore(repo)
    store.getState().start()

    renderPage(store)
    await flush()

    // One write per unread notification. An effect watching the count would write six or more.
    expect(saves).toHaveBeenCalledTimes(3)
  })

  it('keeps the rings on what was unread, though the list is now read', async () => {
    const store = startedStore([seeded('a')])
    renderPage(store)
    await flush()

    expect(selectUnreadCount(store.getState())).toBe(0)
    expect(document.querySelector('.ring-\\(--notification-unseen-ring\\)')).not.toBeNull()
  })

  it('clears all notifications via the header overflow menu', async () => {
    const user = userEvent.setup()
    const store = startedStore([seeded()])
    renderPage(store)

    await user.click(screen.getByRole('button', { name: /more options/i }))
    await user.click(await screen.findByRole('menuitem', { name: /clear all/i }))
    await flush()

    expect(store.getState().notifications).toHaveLength(0)
  })
})
