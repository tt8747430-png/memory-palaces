import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectDot } from './SelectDot'

afterEach(cleanup)

describe('SelectDot', () => {
  it('fills with the accent surface when selected', () => {
    const { container } = renderWithProviders(<SelectDot selected />)
    const dot = container.firstElementChild
    expect(dot?.className).toContain('bg-accent')
    expect(dot?.className).toContain('border-accent')
  })

  it('shows an empty ring when unselected', () => {
    const { container } = renderWithProviders(<SelectDot selected={false} />)
    const dot = container.firstElementChild
    expect(dot?.className).toContain('border-border')
    expect(dot?.className).toContain('text-transparent')
  })

  it('is hidden from the accessibility tree', () => {
    const { container } = renderWithProviders(<SelectDot selected />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
  })
})
