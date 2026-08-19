import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { FastReviewFooter } from './FastReviewFooter'

afterEach(cleanup)

describe('FastReviewFooter', () => {
  it('shows both tallies and both buttons', () => {
    renderWithProviders(<FastReviewFooter flipped notQuite={3} gotIt={7} onAnswer={() => {}} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not quite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
  })

  it('reports each outcome', async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    renderWithProviders(<FastReviewFooter flipped notQuite={0} gotIt={0} onAnswer={onAnswer} />)
    await user.click(screen.getByRole('button', { name: 'Not quite' }))
    expect(onAnswer).toHaveBeenCalledWith('notQuite')
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onAnswer).toHaveBeenCalledWith('gotIt')
  })

  it('holds the tallies but hides the answers until the card is turned over', () => {
    renderWithProviders(
      <FastReviewFooter flipped={false} notQuite={2} gotIt={5} onAnswer={() => {}} />,
    )
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
