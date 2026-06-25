import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/shared/i18n'
import { fakeStickyHeader } from '@/shared/test/sticky-header'
import { HomeHeader } from './HomeHeader'

afterEach(cleanup)

function renderHeader(props: Partial<Parameters<typeof HomeHeader>[0]> = {}) {
  const handlers = { onOpenProfile: vi.fn(), onOpenNotifications: vi.fn() }
  render(
    <I18nextProvider i18n={i18n}>
      {/* 500 XP → level 3 (250 XP per level). */}
      <HomeHeader
        header={fakeStickyHeader()}
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
  it('shows the name and the level derived from XP, without a greeting', () => {
    renderHeader()
    expect(screen.getByText('Sam')).toBeTruthy()
    expect(screen.getByText('Level 3')).toBeTruthy()
    expect(screen.queryByText('Hi Sam!')).toBeNull()
  })

  it('surfaces the XP-to-next progress on the profile control', () => {
    renderHeader({ xp: 600 }) // level 3, 100 into the level → 150 remaining
    expect(screen.getByRole('button', { name: /150 XP to level 4/ })).toBeTruthy()
  })

  it('opens the archive when the control is wired', async () => {
    const user = userEvent.setup()
    const onOpenArchived = vi.fn()
    renderHeader({ onOpenArchived })
    await user.click(screen.getByRole('button', { name: /archived palaces/i }))
    expect(onOpenArchived).toHaveBeenCalled()
  })

  it('caps the unread badge at 9+', () => {
    renderHeader({ unreadCount: 15 })
    expect(screen.getByText('9+')).toBeTruthy()
  })

  it('opens the profile and the notifications', async () => {
    const user = userEvent.setup()
    const handlers = renderHeader()

    await user.click(screen.getByRole('button', { name: /open profile/i }))
    await user.click(screen.getByRole('button', { name: /notifications/i }))

    expect(handlers.onOpenProfile).toHaveBeenCalled()
    expect(handlers.onOpenNotifications).toHaveBeenCalled()
  })

  it('renders the photo when an avatar is provided', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <HomeHeader
          header={fakeStickyHeader()}
          name="Sam"
          avatar="data:image/jpeg;base64,zzz"
          xp={0}
          unreadCount={0}
          onOpenProfile={() => {}}
          onOpenNotifications={() => {}}
        />
      </I18nextProvider>,
    )
    expect(container.querySelector('img[src="data:image/jpeg;base64,zzz"]')).toBeTruthy()
  })
})
