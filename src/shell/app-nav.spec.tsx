import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@/shared/i18n'
import { AppNav } from './app-nav'

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
})
