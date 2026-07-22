import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SheetSection } from './SheetSection'

afterEach(cleanup)

describe('SheetSection', () => {
  it('renders its title and children', () => {
    renderWithProviders(
      <SheetSection title="This card">
        <p>Body</p>
      </SheetSection>,
    )
    expect(screen.getByText('This card')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
