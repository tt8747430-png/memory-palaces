import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { DropIndicator } from './DropIndicator'

afterEach(cleanup)

describe('DropIndicator', () => {
  it('renders a decorative line seated at the top for a "before" drop', () => {
    const { container } = renderWithProviders(<DropIndicator position="before" />)
    const line = container.firstElementChild
    expect(line).toHaveAttribute('aria-hidden')
    expect(line?.className).toContain('-top-')
  })

  it('seats the line at the bottom for an "after" drop', () => {
    const { container } = renderWithProviders(<DropIndicator position="after" />)
    expect(container.firstElementChild?.className).toContain('-bottom-')
  })

  it('applies the inset as a left offset', () => {
    const { container } = renderWithProviders(<DropIndicator position="before" inset={16} />)
    expect(container.firstElementChild?.getAttribute('style')).toContain('left: 16px')
  })
})
