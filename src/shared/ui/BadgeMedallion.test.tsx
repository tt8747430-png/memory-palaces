import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { Trophy } from 'lucide-react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { BadgeMedallion } from './BadgeMedallion'

afterEach(cleanup)

describe('BadgeMedallion', () => {
  it('renders the earned surface with a value', () => {
    const { container } = renderWithProviders(<BadgeMedallion icon={Trophy} value={7} />)
    const medallion = container.firstElementChild
    expect(medallion?.className).toContain('shadow-interactive')
    expect(medallion?.textContent).toContain('7')
  })

  it('renders the muted locked surface with a lock adornment', () => {
    const { container } = renderWithProviders(<BadgeMedallion icon={Trophy} locked showLock />)
    const medallion = container.firstElementChild
    expect(medallion?.className).toContain('bg-primary/[0.06]')
    // the lock badge svg is present in the locked+showLock state
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(1)
  })

  it('shows an earned check adornment when requested', () => {
    const withCheck = renderWithProviders(<BadgeMedallion icon={Trophy} showCheck />)
    const withCheckSvgs = withCheck.container.querySelectorAll('svg').length
    cleanup()
    const plain = renderWithProviders(<BadgeMedallion icon={Trophy} />)
    expect(withCheckSvgs).toBeGreaterThan(plain.container.querySelectorAll('svg').length)
  })
})
