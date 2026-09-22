import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ROUTES } from '@/shared/config/routes'
import { BottomSlot } from '@/shared/ui'
import { AppNav } from './AppNav'

const { navigate, nav } = vi.hoisted(() => ({
  navigate: vi.fn(),
  nav: { path: '/' as string },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { pathname: nav.path } }),
}))

afterEach(() => {
  cleanup()
  navigate.mockReset()
  nav.path = ROUTES.home
})

describe('AppNav', () => {
  it('renders the tab bar and marks the active destination', () => {
    nav.path = ROUTES.home
    renderWithProviders(<AppNav />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Profile' })).not.toHaveAttribute('aria-current')
  })

  it('navigates to the tapped destination', async () => {
    const user = userEvent.setup()
    nav.path = ROUTES.home
    renderWithProviders(<AppNav />)
    await user.click(screen.getByRole('button', { name: 'Profile' }))
    expect(navigate).toHaveBeenCalledWith({ to: ROUTES.profile })
  })

  it('renders nothing on a route without a tab', () => {
    nav.path = '/settings'
    const { container } = renderWithProviders(<AppNav />)
    expect(container).toBeEmptyDOMElement()
  })

  it('stays out of the way inside a folder — a folder is a page, not a tab', () => {
    nav.path = '/folders/abc123'
    const { container } = renderWithProviders(<AppNav />)
    expect(container).toBeEmptyDOMElement()
  })

  it('hands its box to an occupant and takes it back, never letting the slot collapse', async () => {
    const inset = () => document.documentElement.style.getPropertyValue('--app-bottom-inset')
    function Selecting({ on }: { on: boolean }) {
      return (
        <>
          <AppNav />
          <BottomSlot open={on}>
            <div data-testid="toolbar">toolbar</div>
          </BottomSlot>
        </>
      )
    }

    nav.path = ROUTES.home
    const { rerender } = renderWithProviders(<Selecting on={false} />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.queryByTestId('toolbar')).toBeNull()

    rerender(<Selecting on />)
    // The occupant is in the dock at once, and the box beneath both never lets go of the slot.
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    expect(inset()).toContain('4rem')
    await waitForElementToBeRemoved(() => screen.queryByRole('navigation', { name: 'Primary' }))
    expect(inset()).toContain('4rem')

    rerender(<Selecting on={false} />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    await waitForElementToBeRemoved(() => screen.queryByTestId('toolbar'))
    expect(inset()).toContain('4rem')
  })

  it('opens the box for an occupant on a route without a tab, and closes it after', async () => {
    nav.path = '/decks/abc123/questions'
    function Selecting({ on }: { on: boolean }) {
      return (
        <>
          <AppNav />
          <BottomSlot open={on}>
            <div data-testid="toolbar">toolbar</div>
          </BottomSlot>
        </>
      )
    }
    const { rerender } = renderWithProviders(<Selecting on />)
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary' })).toBeNull()

    rerender(<Selecting on={false} />)
    await waitForElementToBeRemoved(() => screen.queryByTestId('toolbar'))
    expect(screen.queryByRole('navigation', { name: 'Primary' })).toBeNull()
  })

  it('raises the app bottom inset only while it is mounted', () => {
    const inset = () => document.documentElement.style.getPropertyValue('--app-bottom-inset')

    nav.path = ROUTES.home
    const { unmount } = renderWithProviders(<AppNav />)
    expect(inset()).toContain('4rem')
    unmount()
    expect(inset()).toBe('')

    nav.path = '/folders/abc123'
    renderWithProviders(<AppNav />)
    expect(inset()).toBe('')
  })
})
