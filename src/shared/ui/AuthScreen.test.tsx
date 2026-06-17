import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AuthScreen } from './AuthScreen'

afterEach(cleanup)

describe('AuthScreen', () => {
  it('renders its content above the ambient atmosphere', () => {
    render(
      <AuthScreen>
        <h1>Sign in</h1>
      </AuthScreen>,
    )
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('keeps the atmosphere decorative — hidden from assistive tech and non-interactive', () => {
    render(<AuthScreen>content</AuthScreen>)
    const atmosphere = screen.getByTestId('auth-atmosphere')
    expect(atmosphere).toHaveAttribute('aria-hidden', 'true')
    expect(atmosphere).toHaveClass('pointer-events-none')
  })
})
