import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { SelectDot } from './SelectDot'

afterEach(cleanup)

describe('SelectDot', () => {
  it('fills with the accent surface and a tick when checked', () => {
    const { container } = renderWithProviders(<SelectDot state="checked" />)
    const dot = container.firstElementChild
    expect(dot?.className).toContain('bg-accent')
    expect(dot?.className).toContain('border-accent')
    expect(dot?.querySelector('svg')?.getAttribute('class')).toContain('lucide-check')
  })

  it('shows an empty ring when unchecked', () => {
    const { container } = renderWithProviders(<SelectDot state="unchecked" />)
    const dot = container.firstElementChild
    expect(dot?.className).toContain('border-border')
    expect(dot?.className).toContain('text-transparent')
  })

  it('fills with an accent bar when indeterminate', () => {
    const { container } = renderWithProviders(<SelectDot state="indeterminate" />)
    const dot = container.firstElementChild
    expect(dot?.className).toContain('bg-accent')
    // The bar (Minus) rather than the tick (Check) marks a partial subtree.
    expect(dot?.querySelector('svg')?.getAttribute('class')).toContain('lucide-minus')
  })

  it('is hidden from the accessibility tree', () => {
    const { container } = renderWithProviders(<SelectDot state="checked" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
  })
})
