import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CardMaturityOverview } from './CardMaturityOverview'

afterEach(cleanup)

describe('CardMaturityOverview', () => {
  it('renders the maturity breakdown with per-status counts', () => {
    renderWithProviders(
      <CardMaturityOverview total={10} counts={{ new: 3, learning: 2, known: 5 }} />,
    )
    expect(screen.getByText('Cards in this deck (10)')).toBeInTheDocument()
    const known = screen.getByText('Known').closest('li')
    expect(known).toHaveTextContent('5')
  })

  it('renders the proportion bar only when there are cards', () => {
    const filled = renderWithProviders(
      <CardMaturityOverview total={4} counts={{ new: 1, learning: 1, known: 2 }} />,
    )
    expect(filled.container.querySelector('.h-2')).not.toBeNull()
    cleanup()

    const empty = renderWithProviders(
      <CardMaturityOverview total={0} counts={{ new: 0, learning: 0, known: 0 }} />,
    )
    expect(empty.container.querySelector('.h-2')).toBeNull()
    expect(screen.getByText('Cards in this deck (0)')).toBeInTheDocument()
  })
})
