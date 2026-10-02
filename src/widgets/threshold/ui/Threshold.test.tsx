import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { Threshold } from './Threshold'

afterEach(cleanup)

describe('Threshold', () => {
  it.each(['build', 'none'] as const)(
    'renders the brand mark image with its accessible name (%s)',
    (entrance) => {
      renderWithProviders(<Threshold entrance={entrance} />)
      expect(screen.getByRole('img', { name: 'Mindscape' })).toBeInTheDocument()
    },
  )

  it('keeps its paint apart from another mark on the same page', () => {
    renderWithProviders(
      <>
        <Threshold entrance="none" />
        <Threshold entrance="none" />
      </>,
    )
    const [first, second] = screen
      .getAllByRole('img', { name: 'Mindscape' })
      .map((mark) => mark.querySelector('radialGradient')?.id)
    expect(first).toBeTruthy()
    expect(first).not.toBe(second)
  })
})
