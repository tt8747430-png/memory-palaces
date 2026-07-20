import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfig } from 'motion/react'
import '@/shared/i18n'
import type { MatchCard } from '@/practice'
import { MatchBoard } from './match-board'

afterEach(cleanup)

const CARDS: MatchCard[] = [
  { id: 'l1', front: 'Alpha', back: 'first letter' },
  { id: 'l2', front: 'Beta', back: 'second letter' },
]

function renderBoard(cards: MatchCard[] = CARDS) {
  const onComplete = vi.fn()
  render(
    <MotionConfig reducedMotion="always">
      <MatchBoard cards={cards} subtitle="Atrium" onBack={() => {}} onComplete={onComplete} />
    </MotionConfig>,
  )
  return { onComplete }
}

describe('MatchBoard', () => {
  it('clears every pair and wins', async () => {
    const user = userEvent.setup()
    const { onComplete } = renderBoard()

    await user.click(screen.getByRole('button', { name: 'Alpha' }))
    await user.click(screen.getByRole('button', { name: 'first letter' }))
    await user.click(screen.getByRole('button', { name: 'Beta' }))
    await user.click(screen.getByRole('button', { name: 'second letter' }))

    expect(await screen.findByText('All matched')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /done/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('leaves a mismatched pair on the board', async () => {
    const user = userEvent.setup()
    renderBoard()

    await user.click(screen.getByRole('button', { name: 'Alpha' }))
    await user.click(screen.getByRole('button', { name: 'Beta' }))

    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument()
  })

  it('needs at least two cards to play', () => {
    renderBoard([{ id: 'l1', front: 'Solo', back: 'only one' }])
    expect(screen.getByText(/not enough cards/i)).toBeInTheDocument()
  })
})
