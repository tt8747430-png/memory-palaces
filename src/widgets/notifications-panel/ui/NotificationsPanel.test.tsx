import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { makeNotification, type AppNotification } from '@/entities/notification'
import { NotificationsPanel } from './NotificationsPanel'

afterEach(cleanup)

const DAY = 86_400_000
const NOW = Date.UTC(2026, 5, 16, 12, 0, 0)
const iso = (ms: number) => new Date(ms).toISOString()

function renderPanel(props: Partial<Parameters<typeof NotificationsPanel>[0]> = {}) {
  const handlers = { onRemove: vi.fn(), onClearAll: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      <NotificationsPanel notifications={[]} now={NOW} {...handlers} {...props} />
    </I18nextProvider>,
  )
  return handlers
}

describe('NotificationsPanel', () => {
  it('shows the empty state when there are no notifications', () => {
    renderPanel({ notifications: [] })
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument()
  })

  it('renders milestone copy and the XP chip per type', () => {
    const list: AppNotification[] = [
      makeNotification({ id: 'a', createdAt: iso(NOW - 1000), type: 'level-up', level: 3 }),
      makeNotification({ id: 'b', createdAt: iso(NOW - 2000), type: 'streak', count: 7 }),
      makeNotification({
        id: 'c',
        createdAt: iso(NOW - 3000),
        type: 'quiz',
        accuracy: 90,
        xpGain: 60,
      }),
    ]
    renderPanel({ notifications: list })

    expect(screen.getByText('Level 3 reached')).toBeInTheDocument()
    expect(screen.getByText('7-day streak')).toBeInTheDocument()
    expect(screen.getByText('New best quiz')).toBeInTheDocument()
    expect(screen.getByText('+60')).toBeInTheDocument()
  })

  it('groups notifications under day sections', () => {
    const list: AppNotification[] = [
      makeNotification({ id: 'a', createdAt: iso(NOW - 1000), type: 'level-up', level: 2 }),
      makeNotification({ id: 'b', createdAt: iso(NOW - DAY), type: 'streak', count: 7 }),
    ]
    renderPanel({ notifications: list })

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Yesterday')).toBeInTheDocument()
  })

  it('removes a single notification', async () => {
    const user = userEvent.setup()
    const list: AppNotification[] = [
      makeNotification({ id: 'a', createdAt: iso(NOW - 1000), type: 'streak', count: 7 }),
    ]
    const handlers = renderPanel({ notifications: list })

    await user.click(screen.getByRole('button', { name: /remove notification/i }))

    expect(handlers.onRemove).toHaveBeenCalledWith('a')
  })
})
