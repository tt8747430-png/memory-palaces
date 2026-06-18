import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { fakeCollapsibleHeader } from '@/shared/test/collapsible-header'
import { HomeHeader } from './HomeHeader'

afterEach(cleanup)

function renderHeader(props: Partial<Parameters<typeof HomeHeader>[0]> = {}) {
  const handlers = { onOpenProfile: vi.fn(), onOpenNotifications: vi.fn(), onOpenStreak: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      {/* 500 XP → level 3 (250 XP per level). */}
      <HomeHeader
        header={fakeCollapsibleHeader()}
        name="Sam"
        xp={500}
        unreadCount={0}
        {...handlers}
        {...props}
      />
    </I18nextProvider>,
  )
  return handlers
}

describe('HomeHeader', () => {
  it('greets the user and shows the level derived from XP', () => {
    renderHeader()
    expect(screen.getAllByText('Hi Sam!').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lv. 3').length).toBeGreaterThan(0)
  })

  it('surfaces the XP-to-next progress', () => {
    renderHeader({ xp: 600 }) // level 3, 100 into the level → 150 remaining
    expect(screen.getAllByLabelText('150 XP to level 4').length).toBeGreaterThan(0)
  })

  it('caps the unread badge at 9+', () => {
    renderHeader({ unreadCount: 15 })
    expect(screen.getAllByText('9+').length).toBeGreaterThan(0)
  })

  it('opens the profile and the notifications', async () => {
    const user = userEvent.setup()
    const handlers = renderHeader()

    // The hero (rendered last) is interactive at the top; the compact bar is
    // pointer-events:none until you scroll.
    await user.click(screen.getAllByRole('button', { name: /open profile/i }).at(-1)!)
    await user.click(screen.getAllByRole('button', { name: /notifications/i }).at(-1)!)

    expect(handlers.onOpenProfile).toHaveBeenCalled()
    expect(handlers.onOpenNotifications).toHaveBeenCalled()
  })

  it('opens the streak screen from the streak chip', async () => {
    const user = userEvent.setup()
    const handlers = renderHeader({ showStats: true, streakCount: 5 })
    await user.click(screen.getByRole('button', { name: /open streak/i }))
    expect(handlers.onOpenStreak).toHaveBeenCalled()
  })

  it('renders the photo when an avatar is provided', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <HomeHeader
          header={fakeCollapsibleHeader()}
          name="Sam"
          avatar="data:image/jpeg;base64,zzz"
          xp={0}
          unreadCount={0}
          onOpenProfile={() => {}}
          onOpenNotifications={() => {}}
          onOpenStreak={() => {}}
        />
      </I18nextProvider>,
    )
    expect(container.querySelector('img[src="data:image/jpeg;base64,zzz"]')).toBeTruthy()
  })
})
