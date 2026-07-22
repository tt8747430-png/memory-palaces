import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { makeFaceProps } from './face-fixtures'
import { TypeFace } from './TypeFace'

afterEach(cleanup)

describe('TypeFace', () => {
  it('renders the prompt and a typing input', () => {
    renderWithProviders(
      <TypeFace {...makeFaceProps({ mode: 'type', prompt: 'Motto?', answer: 'Carpe diem' })} />,
    )
    expect(screen.getByRole('heading', { name: 'Motto?' })).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Type the answer from memory…' }),
    ).toBeInTheDocument()
  })

  it('fills the next word from the aid control', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TypeFace {...makeFaceProps({ mode: 'type', prompt: 'Motto?', answer: 'Carpe diem' })} />,
    )
    await user.click(screen.getByRole('button', { name: 'Next word' }))
    const input = screen.getByRole('textbox', {
      name: 'Type the answer from memory…',
    }) as HTMLTextAreaElement
    expect(input.value).toContain('Carpe')
  })

  it('keeps the typed text and its feedback in view once the answer is complete', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TypeFace {...makeFaceProps({ mode: 'type', prompt: 'Ping', answer: 'Pong answer here' })} />,
    )
    const input = screen.getByRole('textbox', {
      name: 'Type the answer from memory…',
    }) as HTMLTextAreaElement
    await user.click(input)
    await user.type(input, 'Pong answer here')
    // The input is not stripped, and the per-word feedback stays instead of collapsing away.
    expect(input.value).toBe('Pong answer here')
    expect(screen.getByLabelText('What you typed, checked against the answer')).toBeInTheDocument()
    expect(screen.getByText('answer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('signals completion once every initial is recalled', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <TypeFace
        {...makeFaceProps({
          mode: 'type',
          typeInitialsOnly: true,
          prompt: 'Ping',
          answer: 'Pong answer here',
        })}
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Type first letters…' })
    await user.click(input)
    await user.type(input, 'pah')
    expect(screen.getByText('Recalled — every initial')).toBeInTheDocument()
  })
})
