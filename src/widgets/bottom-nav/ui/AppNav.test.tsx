import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { ROUTES } from '@/shared/config/routes'
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
})
