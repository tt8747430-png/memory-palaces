import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { AnswerFace } from './AnswerFace'

afterEach(cleanup)

describe('AnswerFace', () => {
  it('renders the full answer', () => {
    renderWithProviders(<AnswerFace {...makeFaceProps({ answer: 'Paris' })} />)
    expect(screen.getByText('Paris')).toBeInTheDocument()
  })

  it('flips back to the prompt from the back-prompt control', async () => {
    const user = userEvent.setup()
    const onFlip = vi.fn()
    renderWithProviders(<AnswerFace {...makeFaceProps({ onFlip })} />)
    await user.click(screen.getByRole('button', { name: 'Show front' }))
    expect(onFlip).toHaveBeenCalledTimes(1)
  })

  it('reads the answer aloud when speech is available', async () => {
    const user = userEvent.setup()
    const onSpeak = vi.fn()
    renderWithProviders(
      <AnswerFace {...makeFaceProps({ answer: 'Paris', canSpeak: true, onSpeak })} />,
    )
    await user.click(screen.getByRole('button', { name: 'Read aloud' }))
    expect(onSpeak).toHaveBeenCalledWith('Paris')
  })
})
