import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { AuthLogo } from './AuthLogo'

afterEach(cleanup)

describe('AuthLogo', () => {
  it('renders the brand mark with an accessible name', () => {
    renderWithProviders(<AuthLogo />)
    expect(screen.getByRole('img', { name: 'Mindscape' })).toBeInTheDocument()
  })
})
