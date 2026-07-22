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
})
