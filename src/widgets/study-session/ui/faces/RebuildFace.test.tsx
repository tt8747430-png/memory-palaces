import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { RebuildFace } from './RebuildFace'

afterEach(cleanup)

describe('RebuildFace', () => {
  it('renders the rebuild hint and a chip per answer word', () => {
    renderWithProviders(
      <RebuildFace {...makeFaceProps({ mode: 'words', answer: 'alpha beta gamma' })} />,
    )
    expect(screen.getByText('Tap the words in order.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'alpha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'beta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'gamma' })).toBeInTheDocument()
  })

  it('completes the answer when the words are tapped in order', async () => {
    const user = userEvent.setup()
    const onRevealInPlace = vi.fn()
    renderWithProviders(
      <RebuildFace
        {...makeFaceProps({ mode: 'words', answer: 'alpha beta gamma', onRevealInPlace })}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'alpha' }))
    await user.click(screen.getByRole('button', { name: 'beta' }))
    await user.click(screen.getByRole('button', { name: 'gamma' }))
    expect(onRevealInPlace).toHaveBeenCalled()
  })
})
