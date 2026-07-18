import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { AppNav } from './app-nav'
import { useHideTabNav } from './tab-nav-visibility'

afterEach(cleanup)

describe('AppNav', () => {
  it('renders both tabs at the home route, with Home marked current', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppNav />
      </MemoryRouter>,
    )

    const home = screen.getByText('Home')
    const profile = screen.getByText('Profile')
    expect(home).toBeInTheDocument()
    expect(profile).toBeInTheDocument()
    expect(home.closest('button')).toHaveAttribute('aria-current', 'page')
    expect(profile.closest('button')).not.toHaveAttribute('aria-current')
  })

  it('renders nothing off the tab routes', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/decks/x']}>
        <AppNav />
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('hides on a drill-down that never changed the route, such as an open folder', () => {
    const drillDown = renderHook(({ on }) => useHideTabNav(on), { initialProps: { on: true } })
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <AppNav />
      </MemoryRouter>,
    )

    expect(container).toBeEmptyDOMElement()

    drillDown.rerender({ on: false })
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('comes back when the surface that hid it unmounts', () => {
    renderHook(() => useHideTabNav(true)).unmount()

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppNav />
      </MemoryRouter>,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
