import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { PromptFace } from './PromptFace'

afterEach(cleanup)

describe('PromptFace', () => {
  it('renders the prompt', () => {
    renderWithProviders(<PromptFace {...makeFaceProps({ prompt: 'Capital of France?' })} />)
    expect(screen.getByRole('heading', { name: 'Capital of France?' })).toBeInTheDocument()
  })

  it('flips to the answer from the reveal control', async () => {
    const user = userEvent.setup()
    const onFlip = vi.fn()
    renderWithProviders(<PromptFace {...makeFaceProps({ onFlip })} />)
    await user.click(screen.getByRole('button', { name: 'Show answer' }))
    expect(onFlip).toHaveBeenCalledTimes(1)
  })
})
