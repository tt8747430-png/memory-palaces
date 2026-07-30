import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ROUTES } from '@/shared/config/routes'
import { useHideAppNav } from '@/shared/lib'
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

  it('steps aside — and gives its inset back — while a surface claims the bottom edge', async () => {
    const inset = () => document.documentElement.style.getPropertyValue('--app-bottom-inset')
    function Selecting({ on }: { on: boolean }) {
      useHideAppNav(on)
      return <AppNav />
    }

    nav.path = ROUTES.home
    const { rerender } = renderWithProviders(<Selecting on={false} />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()

    rerender(<Selecting on />)
    expect(inset()).toBe('')
    await waitForElementToBeRemoved(() => screen.queryByRole('navigation', { name: 'Primary' }))

    rerender(<Selecting on={false} />)
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(inset()).toContain('4rem')
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
