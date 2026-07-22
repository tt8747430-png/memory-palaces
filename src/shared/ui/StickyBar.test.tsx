import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { StickyBar } from './StickyBar'

afterEach(cleanup)

describe('StickyBar', () => {
  it('renders its children inside the bar', () => {
    renderWithProviders(
      <StickyBar elevation={motionValue(0)}>
        <span>Title</span>
        <button type="button">Add</button>
      </StickyBar>,
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})
