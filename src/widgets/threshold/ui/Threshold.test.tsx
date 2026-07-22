import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Threshold } from './Threshold'

afterEach(cleanup)

describe('Threshold', () => {
  it('renders the brand mark image with its accessible name', () => {
    renderWithProviders(<Threshold />)
    expect(screen.getByRole('img', { name: 'Mindscape' })).toBeInTheDocument()
  })

  it('uses the primary tint for the light tone', () => {
    renderWithProviders(<Threshold tone="light" />)
    expect(screen.getByRole('img', { name: 'Mindscape' }).getAttribute('class')).toContain(
      'text-primary',
    )
  })

  it('uses the secondary tint for the dark tone', () => {
    renderWithProviders(<Threshold tone="dark" />)
    expect(screen.getByRole('img', { name: 'Mindscape' }).getAttribute('class')).toContain(
      'text-secondary',
    )
  })
})
