import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { CompletionOverlay } from './CompletionOverlay'

afterEach(cleanup)

describe('CompletionOverlay', () => {
  it('summarises the session and its reviewed count', () => {
    renderWithProviders(
      <CompletionOverlay summary={{ graded: 8, known: 5, learning: 3 }} onDone={() => {}} />,
    )
    expect(screen.getByRole('heading', { name: 'Session complete' })).toBeInTheDocument()
    expect(screen.getByText('8 cards reviewed')).toBeInTheDocument()
    expect(screen.getByText('5 Known')).toBeInTheDocument()
    expect(screen.getByText('3 Still learning')).toBeInTheDocument()
  })

  it('fires onDone from the primary action', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    renderWithProviders(
      <CompletionOverlay summary={{ graded: 1, known: 0, learning: 0 }} onDone={onDone} />,
    )
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
