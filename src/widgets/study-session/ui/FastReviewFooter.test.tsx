import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { FastReviewFooter, type FastReviewFooterProps } from './FastReviewFooter'

afterEach(cleanup)

const render = (props: Partial<FastReviewFooterProps> = {}) =>
  renderWithProviders(
    <FastReviewFooter
      flipped
      notQuite={0}
      gotIt={0}
      onAnswer={() => {}}
      onReveal={() => {}}
      onUndo={() => {}}
      canUndo={false}
      {...props}
    />,
  )

describe('FastReviewFooter', () => {
  it('gives the whole row to the two answers once the card is turned over', () => {
    render({ notQuite: 3, gotIt: 7 })
    expect(screen.getByRole('button', { name: 'Not quite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
  })

  it('reports each outcome', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render({ onAnswer })
    await user.click(screen.getByRole('button', { name: 'Not quite' }))
    expect(onAnswer).toHaveBeenCalledWith('notQuite')
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onAnswer).toHaveBeenCalledWith('gotIt')
  })

  it('shows the tallies, and hides the answers, until the card is turned over', () => {
    render({ flipped: false, notQuite: 2, gotIt: 5 })
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('offers a button that shows the answer, rather than a caption saying to tap', async () => {
    const user = userEvent.setup()
    const onReveal = vi.fn()
    render({ flipped: false, onReveal })

    const reveal = screen.getByRole('button', { name: 'Tap to show answer' })
    expect(reveal).toHaveAttribute('data-flip')
    await user.click(reveal)
    expect(onReveal).toHaveBeenCalled()
  })

  it('offers undo only when there is something to undo', () => {
    render({ flipped: false })
    expect(screen.getByRole('button', { name: 'Undo last card' })).toBeDisabled()

    cleanup()
    render({ flipped: false, canUndo: true })
    expect(screen.getByRole('button', { name: 'Undo last card' })).toBeEnabled()
  })
})
